import re
import difflib
from datetime import datetime, timezone
from abc import ABC, abstractmethod
from typing import List, Tuple, Set, Optional, Dict, Any

from app.core.config import settings
from app.schemas.match import MaterialMatchResponse, MatchSignalBreakdown
from app.schemas.material import MaterialResponse
from app.schemas.common import MatchRelationship, ApprovalStatus


def _normalize_text(text: Optional[str]) -> str:
    """Normalize text by converting to uppercase, stripping non-alphanumeric chars, and collapsing whitespace."""
    if not text:
        return ""
    cleaned = re.sub(r"[^A-Za-z0-9\s\.\-\/]", " ", str(text).upper())
    return " ".join(cleaned.split())


def _tokenize(text: Optional[str]) -> Set[str]:
    """Extract alphanumeric token set from text."""
    if not text:
        return set()
    norm = _normalize_text(text)
    return set(norm.split())


def _token_jaccard(tokens_a: Set[str], tokens_b: Set[str]) -> float:
    """Calculate Jaccard similarity index between two token sets."""
    if not tokens_a and not tokens_b:
        return 1.0
    if not tokens_a or not tokens_b:
        return 0.0
    intersection = len(tokens_a & tokens_b)
    union = len(tokens_a | tokens_b)
    return intersection / union if union > 0 else 0.0


def _sequence_similarity(text_a: Optional[str], text_b: Optional[str]) -> float:
    """Calculate character sequence similarity ratio using difflib SequenceMatcher."""
    norm_a = _normalize_text(text_a)
    norm_b = _normalize_text(text_b)
    if not norm_a and not norm_b:
        return 1.0
    if not norm_a or not norm_b:
        return 0.0
    if norm_a == norm_b:
        return 1.0
    return difflib.SequenceMatcher(None, norm_a, norm_b).ratio()


# Canonical UOM interchangeability groups
UOM_EQUIVALENCE_GROUPS = [
    {"NOS", "NO", "EA", "EACH", "PIECE", "PCS", "NUM", "UNIT", "UNITS"},
    {"MTR", "M", "METRE", "METER", "MTRS"},
    {"KG", "KGS", "KILOGRAM", "KILOGRAMS"},
    {"LTR", "L", "LITRE", "LITER", "LTRS"},
    {"SET", "SETS", "KIT", "KITS"},
    {"PAIR", "PAIRS"},
    {"ROLL", "ROLLS"},
    {"BOX", "BOXES", "PKT", "PACKET"},
    {"DRUM", "DRUMS"},
    {"CAN", "CANS"},
]

# Canonical metallurgy / grade equivalents
GRADE_EQUIVALENCE_GROUPS = [
    {"SS304", "AISI304", "SUS304", "1.4301"},
    {"SS316", "AISI316", "SUS316", "SS316L", "1.4401"},
    {"CS", "CARBONSTEEL", "A105", "ASTMA105", "WPB"},
    {"MS", "MILDSTEEL", "IS2062", "FE410"},
    {"BRASS", "CUZN", "C36000"},
    {"CI", "CASTIRON", "FG200", "FG260"},
    {"EN8", "080M40", "AISI1040"},
]


class BaseMatchingEngine(ABC):
    """
    Abstract contract for N-MAT Matching Engines.
    Guarantees that both the Mock Engine (Phase 6) and the trained
    PyTorch/Sentence-Transformers Model (Phase 8 Real ML Integration, trained in Phase 7)
    expose the identical logical interface to the backend and frontend.
    """

    @abstractmethod
    async def analyze_pair(
        self, material_a: MaterialResponse, material_b: MaterialResponse
    ) -> MaterialMatchResponse:
        """Evaluate a pair of CPSE materials and return similarity breakdown and classification."""
        pass

    @abstractmethod
    async def batch_match(
        self, pairs: List[Tuple[MaterialResponse, MaterialResponse]]
    ) -> List[MaterialMatchResponse]:
        """Perform batch deduplication over candidate material pairs."""
        pass


class MockMatchingEngine(BaseMatchingEngine):
    """
    DEMO / MOCK HEURISTIC Matching Engine.
    Employs deterministic multi-signal engineering heuristics and rule-based
    similarity algorithms for demonstration and platform workflow testing.
    Does NOT use trained neural network models, vector databases, or semantic embeddings.
    Strictly deterministic: identical material inputs yield identical scores and classifications.
    """

    def _compute_description_similarity(self, desc_a: str, desc_b: str) -> float:
        norm_a = _normalize_text(desc_a)
        norm_b = _normalize_text(desc_b)
        if norm_a == norm_b:
            return 100.0
        tok_a = _tokenize(desc_a)
        tok_b = _tokenize(desc_b)
        jaccard = _token_jaccard(tok_a, tok_b)
        seq = _sequence_similarity(desc_a, desc_b)
        score = 100.0 * (0.6 * jaccard + 0.4 * seq)
        return round(score, 1)

    def _compute_specification_similarity(
        self,
        specs_a: Dict[str, str],
        specs_b: Dict[str, str],
        desc_a: str,
        desc_b: str,
    ) -> float:
        if specs_a and specs_b:
            shared_keys = set(specs_a.keys()) & set(specs_b.keys())
            all_keys = set(specs_a.keys()) | set(specs_b.keys())
            if all_keys:
                key_match_ratio = len(shared_keys) / len(all_keys)
                val_sims = []
                for k in shared_keys:
                    val_sims.append(_sequence_similarity(specs_a[k], specs_b[k]))
                val_score = sum(val_sims) / len(val_sims) if val_sims else 0.0
                score = 100.0 * (0.4 * key_match_ratio + 0.6 * val_score)
                return round(score, 1)

        # Fall back to string similarity of specifications or descriptions
        str_a = " ".join(f"{k}={v}" for k, v in sorted(specs_a.items())) if specs_a else ""
        str_b = " ".join(f"{k}={v}" for k, v in sorted(specs_b.items())) if specs_b else ""
        if str_a and str_b:
            return round(100.0 * _sequence_similarity(str_a, str_b), 1)

        return self._compute_description_similarity(desc_a, desc_b)

    def _compute_category_family_compatibility(
        self,
        category_a: Optional[str],
        category_b: Optional[str],
        family_a: Optional[str],
        family_b: Optional[str],
    ) -> float:
        cat_a = _normalize_text(category_a)
        cat_b = _normalize_text(category_b)
        fam_a = _normalize_text(family_a)
        fam_b = _normalize_text(family_b)

        if cat_a and cat_b and cat_a == cat_b:
            if fam_a and fam_b:
                if fam_a == fam_b:
                    return 100.0
                fam_sim = _sequence_similarity(fam_a, fam_b)
                return round(70.0 + 25.0 * fam_sim, 1)
            return 92.0

        if cat_a and cat_b and (cat_a in cat_b or cat_b in cat_a):
            return 80.0

        tok_overlap = _token_jaccard(_tokenize(cat_a), _tokenize(cat_b))
        if tok_overlap > 0:
            return round(40.0 + 35.0 * tok_overlap, 1)

        return 15.0

    def _compute_uom_compatibility(self, uom_a: Optional[str], uom_b: Optional[str]) -> float:
        ua = _normalize_text(uom_a)
        ub = _normalize_text(uom_b)
        if ua == ub and ua:
            return 100.0
        if any(ua in grp and ub in grp for grp in UOM_EQUIVALENCE_GROUPS):
            return 95.0
        if not ua or not ub:
            return 50.0
        return 10.0

    def _compute_size_rating_compatibility(
        self,
        size_a: Optional[str],
        size_b: Optional[str],
        specs_a: Dict[str, str],
        specs_b: Dict[str, str],
    ) -> float:
        sa = size_a or specs_a.get("SIZE") or specs_a.get("RATING") or specs_a.get("DN")
        sb = size_b or specs_b.get("SIZE") or specs_b.get("RATING") or specs_b.get("DN")

        if sa and sb:
            norm_sa = _normalize_text(str(sa))
            norm_sb = _normalize_text(str(sb))
            if norm_sa == norm_sb:
                return 100.0
            seq = _sequence_similarity(norm_sa, norm_sb)
            return round(max(20.0, seq * 100.0), 1)

        if not sa and not sb:
            return 85.0
        return 60.0

    def _compute_material_grade_compatibility(
        self,
        grade_a: Optional[str],
        grade_b: Optional[str],
        specs_a: Dict[str, str],
        specs_b: Dict[str, str],
    ) -> float:
        ga = grade_a or specs_a.get("MATERIAL") or specs_a.get("GRADE")
        gb = grade_b or specs_b.get("MATERIAL") or specs_b.get("GRADE")

        if ga and gb:
            clean_ga = re.sub(r"[\s\-_]", "", str(ga).upper())
            clean_gb = re.sub(r"[\s\-_]", "", str(gb).upper())
            if clean_ga == clean_gb:
                return 100.0
            if any(clean_ga in grp and clean_gb in grp for grp in GRADE_EQUIVALENCE_GROUPS):
                return 95.0
            return 35.0

        if not ga and not gb:
            return 80.0
        return 65.0

    def _compute_manufacturer_similarity(
        self,
        mfg_a: Optional[str],
        mfg_b: Optional[str],
        specs_a: Dict[str, str],
        specs_b: Dict[str, str],
    ) -> float:
        ma = mfg_a or specs_a.get("MAKE") or specs_a.get("MANUFACTURER")
        mb = mfg_b or specs_b.get("MAKE") or specs_b.get("MANUFACTURER")

        if ma and mb:
            norm_ma = _normalize_text(str(ma))
            norm_mb = _normalize_text(str(mb))
            if norm_ma == norm_mb:
                return 100.0
            if norm_ma in norm_mb or norm_mb in norm_ma:
                return 90.0
            if any(term in norm_ma or term in norm_mb for term in ("GENERIC", "MULTIPLE", "APPROVED MAKE", "OPEN")):
                return 75.0
            return 40.0

        if not ma and not mb:
            return 75.0
        return 65.0

    async def analyze_pair(
        self, material_a: MaterialResponse, material_b: MaterialResponse
    ) -> MaterialMatchResponse:
        # Calculate granular signals
        desc_sim = self._compute_description_similarity(
            material_a.raw_description, material_b.raw_description
        )
        spec_sim = self._compute_specification_similarity(
            material_a.specifications,
            material_b.specifications,
            material_a.raw_description,
            material_b.raw_description,
        )
        cat_fam_comp = self._compute_category_family_compatibility(
            material_a.category,
            material_b.category,
            material_a.family,
            material_b.family,
        )
        uom_comp = self._compute_uom_compatibility(material_a.uom, material_b.uom)
        size_comp = self._compute_size_rating_compatibility(
            material_a.size_or_rating,
            material_b.size_or_rating,
            material_a.specifications,
            material_b.specifications,
        )
        grade_comp = self._compute_material_grade_compatibility(
            material_a.material_grade,
            material_b.material_grade,
            material_a.specifications,
            material_b.specifications,
        )
        mfg_sim = self._compute_manufacturer_similarity(
            material_a.manufacturer,
            material_b.manufacturer,
            material_a.specifications,
            material_b.specifications,
        )

        # Attribute similarity is aggregate of size/rating, grade, and OEM alignment
        attr_sim = round(0.45 * size_comp + 0.45 * grade_comp + 0.10 * mfg_sim, 1)

        # Weighted formula for Overall Demo Confidence (Sum of weights = 1.0)
        # Weights: desc: 0.25, spec: 0.20, category/family: 0.20, uom: 0.10, size: 0.10, grade: 0.10, mfg: 0.05
        raw_score = (
            0.25 * desc_sim
            + 0.20 * spec_sim
            + 0.20 * cat_fam_comp
            + 0.10 * uom_comp
            + 0.10 * size_comp
            + 0.10 * grade_comp
            + 0.05 * mfg_sim
        )

        # Engineering penalties for fundamental category, UOM, or metallurgical incompatibility
        if cat_fam_comp < 30.0:
            raw_score = min(raw_score, 38.0)
        if uom_comp < 30.0:
            raw_score = min(raw_score, 42.0)
        if (
            grade_comp <= 35.0
            and material_a.material_grade
            and material_b.material_grade
        ):
            raw_score = min(raw_score, 68.0)

        demo_confidence = round(max(5.0, min(99.0, raw_score)), 1)

        has_mfg_mismatch = (
            bool(material_a.manufacturer)
            and bool(material_b.manufacturer)
            and mfg_sim < 70.0
        )

        # Deterministic Relationship Classification across all 5 classes
        if (
            not has_mfg_mismatch
            and demo_confidence >= 88.0
            and desc_sim >= 85.0
            and cat_fam_comp >= 90.0
            and uom_comp >= 90.0
            and size_comp >= 80.0
            and grade_comp >= 80.0
            and mfg_sim >= 70.0
        ):
            relationship = MatchRelationship.IDENTICAL
        elif (
            not has_mfg_mismatch
            and demo_confidence >= 78.0
            and cat_fam_comp >= 80.0
            and uom_comp >= 80.0
            and size_comp >= 75.0
            and grade_comp >= 75.0
        ):
            relationship = MatchRelationship.DUPLICATE
        elif (
            demo_confidence >= 65.0
            and cat_fam_comp >= 70.0
            and uom_comp >= 70.0
            and grade_comp >= 60.0
        ):
            relationship = MatchRelationship.NEAR_DUPLICATE
        elif (
            demo_confidence >= 45.0
            and cat_fam_comp >= 50.0
            and uom_comp >= 50.0
        ):
            relationship = MatchRelationship.FUNCTIONALLY_EQUIVALENT
        else:
            relationship = MatchRelationship.NOT_EQUIVALENT

        # Explainability: Positive factors (Rationale)
        rationale: List[str] = []
        if cat_fam_comp >= 80.0:
            rationale.append(
                f"Identical industrial classification: {material_a.category}"
            )
        if material_a.family and material_b.family and material_a.family.upper() == material_b.family.upper():
            rationale.append(f"Matching equipment family: {material_a.family}")
        if uom_comp >= 90.0:
            rationale.append(
                f"Compatible engineering Unit of Measurement: {material_a.uom}"
            )
        if desc_sim >= 70.0:
            rationale.append(
                f"Catalog description lexical overlap: {desc_sim}%"
            )
        if size_comp >= 80.0 and (material_a.size_or_rating or material_b.size_or_rating):
            rationale.append(
                f"Consistent size/rating parameter: {material_a.size_or_rating or material_b.size_or_rating}"
            )
        if grade_comp >= 80.0 and (material_a.material_grade or material_b.material_grade):
            rationale.append(
                f"Compatible metallurgy grade: {material_a.material_grade or material_b.material_grade}"
            )
        if mfg_sim >= 80.0 and material_a.manufacturer:
            rationale.append(
                f"Consistent OEM manufacturer: {material_a.manufacturer}"
            )
        if relationship == MatchRelationship.FUNCTIONALLY_EQUIVALENT:
            rationale.append(
                "Materials exhibit operational interchangeability despite catalog terminology differences"
            )
        elif relationship == MatchRelationship.NOT_EQUIVALENT:
            rationale.append(
                "Significant technical parameter or classification mismatch precludes interchangeability"
            )
        rationale.append("Derived via deterministic multi-signal engineering heuristic (Demo mode)")

        # Explainability: Structured differences
        differences: List[str] = []
        if cat_fam_comp < 60.0:
            differences.append(
                f"Equipment classification divergence: '{material_a.category}' vs '{material_b.category}'"
            )
        if material_a.family and material_b.family and material_a.family.upper() != material_b.family.upper():
            differences.append(
                f"Sub-family distinction: '{material_a.family}' vs '{material_b.family}'"
            )
        if uom_comp < 80.0:
            differences.append(
                f"UOM variance: '{material_a.uom}' vs '{material_b.uom}'"
            )
        if (
            mfg_sim < 75.0
            and material_a.manufacturer
            and material_b.manufacturer
        ):
            differences.append(
                f"Manufacturer difference: '{material_a.manufacturer}' ({material_a.cpse}) vs '{material_b.manufacturer}' ({material_b.cpse})"
            )
        if (
            grade_comp < 70.0
            and material_a.material_grade
            and material_b.material_grade
        ):
            differences.append(
                f"Metallurgy / grade discrepancy: '{material_a.material_grade}' vs '{material_b.material_grade}'"
            )
        if (
            size_comp < 70.0
            and material_a.size_or_rating
            and material_b.size_or_rating
        ):
            differences.append(
                f"Rating / dimension divergence: '{material_a.size_or_rating}' vs '{material_b.size_or_rating}'"
            )
        if desc_sim < 80.0:
            differences.append(
                f"Catalog phrasing variance across CPSE legacy systems ({desc_sim}% lexical overlap)"
            )
        if not differences:
            differences.append(
                "No significant parameter discrepancy detected across compared fields"
            )

        # Standardization Recommendation: Reference legitimate existing NMC or return explicit demo pending status
        if material_a.national_material_code:
            recommended_nmc = material_a.national_material_code
        elif material_b.national_material_code:
            recommended_nmc = material_b.national_material_code
        else:
            recommended_nmc = "DEMO RECOMMENDATION: NMC PENDING REVIEW"

        breakdown = MatchSignalBreakdown(
            description_similarity=desc_sim,
            specification_similarity=spec_sim,
            attribute_similarity=attr_sim,
            uom_compatibility=uom_comp,
            manufacturer_match=mfg_sim,
            family_compatibility=cat_fam_comp,
            size_rating_compatibility=size_comp,
            material_grade_compatibility=grade_comp,
        )

        now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M IST")

        return MaterialMatchResponse(
            id=f"match-sim-{material_a.legacy_code}-{material_b.legacy_code}",
            material_a=material_a,
            material_b=material_b,
            confidence=demo_confidence,
            relationship=relationship,
            status=ApprovalStatus.PENDING,
            breakdown=breakdown,
            rationale=rationale,
            detected_differences=differences,
            recommended_nmc=recommended_nmc,
            created_at=now_str,
            engine="MOCK_HEURISTIC",
        )

    async def batch_match(
        self, pairs: List[Tuple[MaterialResponse, MaterialResponse]]
    ) -> List[MaterialMatchResponse]:
        results = []
        for a, b in pairs:
            res = await self.analyze_pair(a, b)
            results.append(res)
        return results


def get_matching_engine() -> BaseMatchingEngine:
    """
    Factory resolving the active matching engine based on environment configuration.
    """
    if settings.AI_MODE.lower() == "mock":
        return MockMatchingEngine()
    elif settings.AI_MODE.lower() == "real":
        raise NotImplementedError(
            "Real ML Matching Engine is scheduled for integration in Phase 8 "
            "(Model Development in Phase 7). "
            "Currently operating in Phase 6 DEMO / MOCK HEURISTIC mode."
        )
    else:
        # Fallback safe default
        return MockMatchingEngine()

