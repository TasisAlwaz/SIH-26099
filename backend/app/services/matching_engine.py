from datetime import datetime, timezone
from abc import ABC, abstractmethod
from typing import List, Tuple
from app.core.config import settings
from app.schemas.match import MaterialMatchResponse, MatchSignalBreakdown
from app.schemas.material import MaterialResponse
from app.schemas.common import MatchRelationship, ApprovalStatus


class BaseMatchingEngine(ABC):
    """
    Abstract contract for N-MAT Matching Engines.
    Guarantees that both the Mock Engine (Phases 0-6) and the trained
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
    Employs engineering attribute heuristics and rule-based similarity matrices
    for demonstration and functional platform testing without loading neural network weights.
    Does NOT use trained AI models, vector search, or semantic embeddings.
    """

    async def analyze_pair(
        self, material_a: MaterialResponse, material_b: MaterialResponse
    ) -> MaterialMatchResponse:
        is_same_category = material_a.category.lower() == material_b.category.lower()
        same_uom = material_a.uom.upper() == material_b.uom.upper()
        same_mfg = (
            material_a.manufacturer and material_b.manufacturer
            and material_a.manufacturer.lower() == material_b.manufacturer.lower()
        )

        if is_same_category and same_uom:
            confidence = 94.8
            relationship = MatchRelationship.DUPLICATE
            breakdown = MatchSignalBreakdown(
                description_similarity=91.5,
                specification_similarity=95.0,
                attribute_similarity=98.0,
                uom_compatibility=100.0,
                manufacturer_match=100.0 if same_mfg else 85.0,
            )
            rationale = [
                f"Identical industrial category: {material_a.category}",
                f"Compatible engineering Unit of Measurement: {material_a.uom}",
                "Dimensional parameters align within standardized master tolerance (Demo heuristic)",
            ]
            differences = [
                "Catalog phrasing variance across participating CPSE legacy systems"
            ]
            recommended_nmc = material_a.national_material_code or f"NMC-{material_a.category[:3].upper()}-6205-STD"
        else:
            confidence = 38.5
            relationship = MatchRelationship.NOT_EQUIVALENT
            breakdown = MatchSignalBreakdown(
                description_similarity=45.0,
                specification_similarity=30.0,
                attribute_similarity=25.0,
                uom_compatibility=100.0 if same_uom else 40.0,
                manufacturer_match=50.0,
            )
            rationale = [
                f"Incompatible equipment classifications ({material_a.category} vs {material_b.category})",
                "Non-interchangeable engineering roles",
            ]
            differences = [
                "Fundamental functional and physical parameter mismatch"
            ]
            recommended_nmc = "N/A"

        now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M IST")

        return MaterialMatchResponse(
            id=f"match-sim-{material_a.legacy_code}-{material_b.legacy_code}",
            material_a=material_a,
            material_b=material_b,
            confidence=confidence,
            relationship=relationship,
            status=ApprovalStatus.PENDING,
            breakdown=breakdown,
            rationale=rationale,
            detected_differences=differences,
            recommended_nmc=recommended_nmc,
            created_at=now_str,
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
            "Currently operating in Phase 5 DEMO / MOCK HEURISTIC mode."
        )
    else:
        # Fallback safe default
        return MockMatchingEngine()
