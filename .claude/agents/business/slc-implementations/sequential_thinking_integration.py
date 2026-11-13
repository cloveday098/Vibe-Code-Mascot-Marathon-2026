#!/usr/bin/env python3
"""
Sequential Thinking Integration with Fact-Checking System
Integrates automated fact-checking into existing reasoning chains
"""

import asyncio
import logging
from typing import Dict, List, Optional, Any, Callable
from dataclasses import dataclass
from datetime import datetime
from fact_check_system import FactCheckIntegrator, FactCheckEngine

logger = logging.getLogger(__name__)

@dataclass
class ThinkingStep:
    step_id: int
    content: str
    confidence: float
    sources: List[str]
    dependencies: List[int] = None
    fact_check_result: Optional[Dict] = None

@dataclass
class ReasoningChain:
    steps: List[ThinkingStep]
    overall_confidence: float
    fact_check_summary: Dict
    created_at: datetime

class SequentialThinkingEnhancer:
    """Enhances sequential thinking chains with fact-checking"""

    def __init__(self):
        self.fact_check_integrator = FactCheckIntegrator()
        self.max_chain_depth = 5
        self.consistency_threshold = 0.8

    async def enhance_reasoning_chain(self,
                                     original_steps: List[str],
                                     context: str = "") -> ReasoningChain:
        """Enhance reasoning chain with fact-checking"""
        logger.info(f"Enhancing reasoning chain with {len(original_steps)} steps")
        start_time = datetime.now()

        enhanced_steps = []
        fact_check_results = []

        for i, step_content in enumerate(original_steps):
            if i >= self.max_chain_depth:
                logger.warning(f"Chain depth exceeds maximum of {self.max_chain_depth}")
                break

            # Create thinking step
            step = ThinkingStep(
                step_id=i,
                content=step_content,
                confidence=0.8,  # Initial confidence
                sources=[],
                dependencies=list(range(max(0, i-2), i))  # Previous 2 steps as dependencies
            )

            # Apply fact-checking
            try:
                enhanced_content, fact_check_result = await self.fact_check_integrator.enhance_response(
                    step_content,
                    f"{context} - Reasoning step {i+1}"
                )

                step.content = enhanced_content
                step.fact_check_result = fact_check_result
                step.confidence = fact_check_result.get('overall_confidence', 0.8)
                step.sources = [
                    source.get('title', 'Unknown')
                    for result in fact_check_result.get('results', [])
                    for source in result.get('sources', [])
                ]

                fact_check_results.append(fact_check_result)

            except Exception as e:
                logger.error(f"Fact-checking failed for step {i}: {e}")
                # Keep original content if fact-checking fails

            enhanced_steps.append(step)

        # Calculate overall confidence
        if enhanced_steps:
            overall_confidence = sum(step.confidence for step in enhanced_steps) / len(enhanced_steps)
        else:
            overall_confidence = 0.0

        # Check consistency
        consistency_score = await self._check_consistency(enhanced_steps)

        # Create summary
        fact_check_summary = {
            "total_steps": len(enhanced_steps),
            "fact_checked_steps": len(fact_check_results),
            "patches_applied": sum(r.get('patches_applied', 0) for r in fact_check_results),
            "average_confidence": overall_confidence,
            "consistency_score": consistency_score,
            "processing_time": (datetime.now() - start_time).total_seconds()
        }

        return ReasoningChain(
            steps=enhanced_steps,
            overall_confidence=overall_confidence,
            fact_check_summary=fact_check_summary,
            created_at=start_time
        )

    async def _check_consistency(self, steps: List[ThinkingStep]) -> float:
        """Check consistency across reasoning steps"""
        if len(steps) < 2:
            return 1.0

        consistency_scores = []

        for i, current_step in enumerate(steps[1:], 1):
            previous_step = steps[i-1]

            # Check if current step logically follows previous steps
            consistency = await self._analyze_step_consistency(previous_step, current_step)
            consistency_scores.append(consistency)

        return sum(consistency_scores) / len(consistency_scores) if consistency_scores else 1.0

    async def _analyze_step_consistency(self, step1: ThinkingStep, step2: ThinkingStep) -> float:
        """Analyze consistency between two reasoning steps"""
        # Simplified consistency analysis
        # In practice, this would use more sophisticated NLP

        # Check if sources overlap (good consistency indicator)
        sources1 = set(step1.sources)
        sources2 = set(step2.sources)
        source_overlap = len(sources1.intersection(sources2)) / max(len(sources1.union(sources2)), 1)

        # Check confidence alignment
        confidence_diff = abs(step1.confidence - step2.confidence)
        confidence_alignment = 1.0 - min(confidence_diff, 1.0)

        # Combine factors
        consistency = (source_overlap * 0.4 + confidence_alignment * 0.6)
        return consistency

class ReasoningQualityValidator:
    """Validates quality of enhanced reasoning chains"""

    def __init__(self):
        self.min_confidence_threshold = 0.7
        self.min_consistency_threshold = 0.75

    def validate_chain(self, chain: ReasoningChain) -> Dict:
        """Validate reasoning chain quality"""
        validation_result = {
            "is_valid": True,
            "issues": [],
            "recommendations": [],
            "quality_score": 0.0
        }

        # Check overall confidence
        if chain.overall_confidence < self.min_confidence_threshold:
            validation_result["is_valid"] = False
            validation_result["issues"].append(
                f"Overall confidence {chain.overall_confidence:.2f} below threshold {self.min_confidence_threshold}"
            )
            validation_result["recommendations"].append(
                "Add more authoritative sources or review uncertain claims"
            )

        # Check consistency
        consistency = chain.fact_check_summary.get('consistency_score', 0.0)
        if consistency < self.min_consistency_threshold:
            validation_result["issues"].append(
                f"Reasoning consistency {consistency:.2f} below threshold {self.min_consistency_threshold}"
            )
            validation_result["recommendations"].append(
                "Review reasoning steps for logical coherence"
            )

        # Check fact-check coverage
        total_steps = chain.fact_check_summary.get('total_steps', 0)
        fact_checked_steps = chain.fact_check_summary.get('fact_checked_steps', 0)
        coverage = fact_checked_steps / max(total_steps, 1)

        if coverage < 0.8:
            validation_result["issues"].append(
                f"Fact-check coverage {coverage:.2f} below 80%"
            )
            validation_result["recommendations"].append(
                "Ensure all reasoning steps are properly fact-checked"
            )

        # Calculate overall quality score
        quality_factors = [
            chain.overall_confidence * 0.4,
            consistency * 0.3,
            coverage * 0.3
        ]
        validation_result["quality_score"] = sum(quality_factors)

        # Determine final validity
        if validation_result["quality_score"] >= 0.75:
            validation_result["is_valid"] = True

        return validation_result

class SequentialThinkingOrchestrator:
    """Orchestrates the enhanced sequential thinking process"""

    def __init__(self):
        self.enhancer = SequentialThinkingEnhancer()
        self.validator = ReasoningQualityValidator()
        self.quality_history = []

    async def process_reasoning(self,
                               reasoning_steps: List[str],
                               context: str = "",
                               max_retries: int = 2) -> Dict:
        """Process reasoning with fact-checking and quality validation"""
        logger.info("Processing enhanced sequential thinking")

        attempt = 0
        best_result = None
        best_quality = 0.0

        while attempt <= max_retries:
            try:
                # Enhance reasoning chain
                chain = await self.enhancer.enhance_reasoning_chain(reasoning_steps, context)

                # Validate quality
                validation = self.validator.validate_chain(chain)

                result = {
                    "chain": chain,
                    "validation": validation,
                    "attempt": attempt,
                    "processing_time": chain.fact_check_summary['processing_time']
                }

                # Check if this is the best result so far
                if validation["quality_score"] > best_quality:
                    best_result = result
                    best_quality = validation["quality_score"]

                # If quality is acceptable, return result
                if validation["is_valid"]:
                    logger.info(f"Valid reasoning chain achieved on attempt {attempt}")
                    return result

                attempt += 1

                # If not valid, provide feedback for next attempt
                logger.warning(f"Attempt {attempt} failed quality validation")

            except Exception as e:
                logger.error(f"Error in attempt {attempt}: {e}")
                attempt += 1

        # Return best result if all attempts failed
        logger.warning(f"All {max_retries + 1} attempts completed. Returning best result.")
        return best_result or {"error": "All processing attempts failed"}

    async def get_quality_metrics(self) -> Dict:
        """Get quality metrics and trends"""
        if not self.quality_history:
            return {"message": "No quality history available"}

        recent_scores = [entry["quality_score"] for entry in self.quality_history[-10:]]

        return {
            "recent_average": sum(recent_scores) / len(recent_scores),
            "trend": "improving" if len(recent_scores) >= 2 and recent_scores[-1] > recent_scores[-2] else "stable",
            "total_processed": len(self.quality_history),
            "success_rate": sum(1 for entry in self.quality_history if entry["is_valid"]) / len(self.quality_history)
        }

# Example usage
async def demo_sequential_thinking():
    """Demonstrate enhanced sequential thinking"""
    orchestrator = SequentialThinkingOrchestrator()

    # Example reasoning steps
    reasoning_steps = [
        "The global AI market is experiencing rapid growth with 35% annual increase.",
        "Major tech companies are investing heavily in AI research and development.",
        "This investment is driving innovation and creating new job opportunities.",
        "The market size is projected to reach $500 billion by 2025.",
        "Businesses that adopt AI early will have significant competitive advantages."
    ]

    # Process with enhanced sequential thinking
    result = await orchestrator.process_reasoning(
        reasoning_steps,
        "AI market analysis and business strategy"
    )

    print("=" * 70)
    print("ENHANCED SEQUENTIAL THINKING RESULTS")
    print("=" * 70)

    if "error" in result:
        print(f"Error: {result['error']}")
        return

    chain = result["chain"]
    validation = result["validation"]

    print(f"Quality Score: {validation['quality_score']:.2f}")
    print(f"Overall Confidence: {chain.overall_confidence:.2%}")
    print(f"Fact-Checked Steps: {chain.fact_check_summary['fact_checked_steps']}/{chain.fact_check_summary['total_steps']}")
    print(f"Patches Applied: {chain.fact_check_summary['patches_applied']}")
    print(f"Processing Time: {chain.fact_check_summary['processing_time']:.2f}s")

    if validation["issues"]:
        print("\nIssues Found:")
        for issue in validation["issues"]:
            print(f"  • {issue}")

    if validation["recommendations"]:
        print("\nRecommendations:")
        for rec in validation["recommendations"]:
            print(f"  • {rec}")

    print("\nEnhanced Reasoning Steps:")
    for i, step in enumerate(chain.steps):
        print(f"\nStep {i+1} (Confidence: {step.confidence:.2f}):")
        print(f"  {step.content}")
        if step.sources:
            print(f"  Sources: {', '.join(step.sources[:3])}")

if __name__ == "__main__":
    asyncio.run(demo_sequential_thinking())