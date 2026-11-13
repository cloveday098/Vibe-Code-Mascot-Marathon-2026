#!/usr/bin/env python3
"""
Simple Decision Flows Implementation (Shape Up 2025 p.89)
Implements ≤3-decision path requirement for Simple SLC dimension
"""

import asyncio
import logging
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
from datetime import datetime
import re

logger = logging.getLogger(__name__)

@dataclass
class DecisionPoint:
    decision_text: str
    decision_type: str
    options: List[str]
    confidence_required: bool

@dataclass
class FlowMetrics:
    total_decisions: int
    decision_types: Dict[str, int]
    complexity_score: float
    user_cognitive_load: float

class DecisionPathAnalyzer:
    """Analyzes and simplifies decision paths to meet Shape Up 2025 requirements"""

    def __init__(self):
        self.max_decisions = 3
        self.decision_patterns = {
            "question": r"[?]",
            "choice": r"\b(?:choose|select|option|pick)\b",
            "confirmation": r"\b(?:yes|no|okay|confirm|proceed)\b",
            "preference": r"\b(?:prefer|rather|better|like)\b"
        }

    def analyze_decision_complexity(self, response_text: str) -> FlowMetrics:
        """Analyze the complexity of decision paths in a response"""
        decisions = self._extract_decisions(response_text)
        decision_types = self._classify_decisions(decisions)

        # Calculate complexity scores
        complexity_score = self._calculate_complexity(decisions, decision_types)
        cognitive_load = self._calculate_cognitive_load(decisions)

        return FlowMetrics(
            total_decisions=len(decisions),
            decision_types=decision_types,
            complexity_score=complexity_score,
            user_cognitive_load=cognitive_load
        )

    def _extract_decisions(self, text: str) -> List[str]:
        """Extract decision points from text"""
        decisions = []
        sentences = re.split(r'[.!?]+', text)

        for sentence in sentences:
            sentence = sentence.strip()
            if any(re.search(pattern, sentence, re.IGNORECASE) for pattern in self.decision_patterns.values()):
                decisions.append(sentence)

        return decisions

    def _classify_decisions(self, decisions: List[str]) -> Dict[str, int]:
        """Classify decisions by type"""
        types = {"question": 0, "choice": 0, "confirmation": 0, "preference": 0, "other": 0}

        for decision in decisions:
            decision_type = "other"
            for pattern_name, pattern in self.decision_patterns.items():
                if re.search(pattern, decision, re.IGNORECASE):
                    decision_type = pattern_name
                    break
            types[decision_type] += 1

        return types

    def _calculate_complexity(self, decisions: List[str], types: Dict[str, int]) -> float:
        """Calculate decision complexity score"""
        if not decisions:
            return 0.0

        # Base complexity on number of decisions
        base_complexity = min(len(decisions) / self.max_decisions, 2.0)

        # Add complexity for different decision types
        type_complexity = (
            types.get("choice", 0) * 0.3 +
            types.get("preference", 0) * 0.4 +
            types.get("question", 0) * 0.2 +
            types.get("confirmation", 0) * 0.1
        )

        return min(base_complexity + type_complexity, 2.0)

    def _calculate_cognitive_load(self, decisions: List[str]) -> float:
        """Calculate estimated cognitive load"""
        if not decisions:
            return 0.0

        # Cognitive load increases with decision count and complexity
        base_load = len(decisions) * 0.25

        # Add load for longer decision texts
        avg_length = sum(len(dec.split()) for dec in decisions) / len(decisions)
        length_load = min(avg_length / 20, 1.0) * 0.5

        return min(base_load + length_load, 2.0)

class FlowSimplifier:
    """Simplifies decision flows to meet ≤3-decision path requirement"""

    def __init__(self):
        self.simplification_strategies = {
            "merge_decisions": self._merge_decisions,
            "prioritize_decisions": self._prioritize_decisions,
            "progressive_disclosure": self._progressive_disclosure,
            "default_selections": self._default_selections
        }

    def simplify_to_three_decisions(self, response_text: str, context: str = "") -> Tuple[str, FlowMetrics]:
        """Simplify response to meet ≤3-decision path requirement"""
        analyzer = DecisionPathAnalyzer()
        original_metrics = analyzer.analyze_decision_complexity(response_text)

        if original_metrics.total_decisions <= 3:
            return response_text, original_metrics

        # Apply simplification strategies
        simplified_text = response_text

        # Strategy 1: Prioritize most important decisions
        simplified_text = self._prioritize_decisions(simplified_text)

        # Strategy 2: Merge related decisions
        simplified_text = self._merge_decisions(simplified_text)

        # Strategy 3: Use progressive disclosure
        simplified_text = self._progressive_disclosure(simplified_text)

        # Strategy 4: Apply defaults where appropriate
        simplified_text = self._default_selections(simplified_text)

        # Analyze simplified text
        new_metrics = analyzer.analyze_decision_complexity(simplified_text)

        return simplified_text, new_metrics

    def _prioritize_decisions(self, text: str) -> str:
        """Keep only the most important decisions"""
        lines = text.split('\n')
        prioritized_lines = []
        decision_count = 0

        # Prioritization rules
        high_priority_patterns = [
            r"\bproceed\b",
            r"\bcontinue\b",
            r"\bconfirm\b",
            r"\byes.*no\b"
        ]

        medium_priority_patterns = [
            r"\bwhich\b.*\bor\b",
            r"\bchoose\b",
            r"\bselect\b"
        ]

        low_priority_patterns = [
            r"\bwould you like\b",
            r"\bdo you want\b",
            r"\bany other\b"
        ]

        for line in lines:
            line = line.strip()
            if not line:
                continue

            # Check if line contains a decision
            has_decision = any(re.search(pattern, line, re.IGNORECASE) for pattern in self.decision_patterns.values())

            if has_decision:
                if decision_count >= 3:
                    # Convert additional decisions to statements or skip
                    if any(re.search(pattern, line, re.IGNORECASE) for pattern in low_priority_patterns):
                        continue  # Skip low-priority decisions
                    else:
                        # Convert to statement
                        line = re.sub(r'\?', '.', line)
                        line = re.sub(r'\b(yes|no|okay)\b', 'consider', line, flags=re.IGNORECASE)
                else:
                    # High and medium priority decisions get priority
                    if any(re.search(pattern, line, re.IGNORECASE) for pattern in high_priority_patterns):
                        prioritized_lines.append(line)
                        decision_count += 1
                    elif any(re.search(pattern, line, re.IGNORECASE) for pattern in medium_priority_patterns):
                        if decision_count < 3:
                            prioritized_lines.append(line)
                            decision_count += 1
            else:
                prioritized_lines.append(line)

        return '\n'.join(prioritized_lines)

    def _merge_decisions(self, text: str) -> str:
        """Merge related decisions into single decision points"""
        lines = text.split('\n')
        merged_lines = []
        current_decision_context = None

        for line in lines:
            line = line.strip()
            if not line:
                continue

            # Check if this is a decision
            if any(re.search(pattern, line, re.IGNORECASE) for pattern in self.decision_patterns.values()):
                # Check if it's related to previous decision
                if current_decision_context and self._is_related_decision(line, current_decision_context):
                    # Merge with previous decision
                    if merged_lines:
                        merged_lines[-1] = self._combine_decisions(merged_lines[-1], line)
                else:
                    merged_lines.append(line)
                    current_decision_context = self._extract_context(line)
            else:
                merged_lines.append(line)
                current_decision_context = None

        return '\n'.join(merged_lines)

    def _progressive_disclosure(self, text: str) -> str:
        """Implement progressive disclosure for complex decision flows"""
        lines = text.split('\n')
        simplified_lines = []
        decision_count = 0

        for line in lines:
            line = line.strip()
            if not line:
                continue

            has_decision = any(re.search(pattern, line, re.IGNORECASE) for pattern in self.decision_patterns.values())

            if has_decision and decision_count >= 2:
                # Convert to progressive disclosure statement
                if '?' in line:
                    line = re.sub(r'\?', '.', line)
                    line = f"Later, you can consider: {line}"
                else:
                    line = f"Next steps include: {line}"

            simplified_lines.append(line)

            if has_decision:
                decision_count += 1

        return '\n'.join(simplified_lines)

    def _default_selections(self, text: str) -> str:
        """Apply intelligent defaults to reduce decision burden"""
        lines = text.split('\n')
        simplified_lines = []

        common_defaults = {
            r"\bwhich.*format\b": "JSON format",
            r"\bwhat.*level\b": "intermediate level",
            r"\bwhich.*method\b": "the standard approach",
            r"\bwhat.*time\b": "the recommended timeframe"
        }

        for line in lines:
            line = line.strip()
            if not line:
                continue

            # Apply common defaults
            for pattern, default in common_defaults.items():
                if re.search(pattern, line, re.IGNORECASE):
                    line = re.sub(r'\bwhich|what\b', f"Using {default} for", line, flags=re.IGNORECASE)
                    line = re.sub(r'\?', '.', line)
                    break

            simplified_lines.append(line)

        return '\n'.join(simplified_lines)

    def _is_related_decision(self, current: str, context: str) -> bool:
        """Check if current decision is related to previous context"""
        if not context:
            return False

        current_words = set(current.lower().split())
        context_words = set(context.lower().split())

        overlap = len(current_words.intersection(context_words))
        return overlap >= 2  # Related if 2+ words overlap

    def _combine_decisions(self, decision1: str, decision2: str) -> str:
        """Combine two related decisions"""
        # Simple combination strategy
        if '?' in decision1 and '?' in decision2:
            # Both are questions - choose the more specific one
            return decision1 if len(decision1) > len(decision2) else decision2
        else:
            # Combine into compound decision
            return f"{decision1.rstrip('?')} and {decision2.lower()}"

    def _extract_context(self, line: str) -> str:
        """Extract context keywords from decision line"""
        # Remove question words and decision indicators
        context = re.sub(r'\b(?:which|what|how|do|would|should|can|could)\b', '', line, flags=re.IGNORECASE)
        context = re.sub(r'\b(?:choose|select|option|pick|prefer)\b', '', context, flags=re.IGNORECASE)
        context = re.sub(r'[?!.]', '', context)
        return context.strip()

class SimpleFlowValidator:
    """Validates that flows meet the ≤3-decision requirement"""

    def __init__(self):
        self.analyzer = DecisionPathAnalyzer()

    def validate_compliance(self, response_text: str) -> Dict:
        """Validate compliance with Shape Up 2025 ≤3-decision requirement"""
        metrics = self.analyzer.analyze_decision_complexity(response_text)

        validation_result = {
            "compliant": metrics.total_decisions <= 3,
            "total_decisions": metrics.total_decisions,
            "max_allowed": 3,
            "excess_decisions": max(0, metrics.total_decisions - 3),
            "complexity_score": metrics.complexity_score,
            "cognitive_load": metrics.user_cognitive_load,
            "recommendations": []
        }

        if not validation_result["compliant"]:
            validation_result["recommendations"] = self._generate_recommendations(metrics)

        return validation_result

    def _generate_recommendations(self, metrics: FlowMetrics) -> List[str]:
        """Generate recommendations for improving decision flow"""
        recommendations = []

        if metrics.total_decisions > 3:
            recommendations.append(f"Reduce decisions by {metrics.total_decisions - 3} to meet Shape Up 2025 standard")

        if metrics.complexity_score > 1.5:
            recommendations.append("Consider merging related decisions to reduce cognitive load")

        if metrics.user_cognitive_load > 1.5:
            recommendations.append("Implement progressive disclosure for complex decision flows")

        if metrics.decision_types.get("preference", 0) > 1:
            recommendations.append("Consider using intelligent defaults for preference decisions")

        return recommendations

# Example usage
async def demo_simple_flows():
    """Demonstrate simple decision flow implementation"""
    simplifier = FlowSimplifier()
    validator = SimpleFlowValidator()

    # Example complex responses
    test_responses = [
        """To implement this feature, you'll need to:

1. Choose your database: MongoDB or PostgreSQL?
2. Select your authentication method: JWT or OAuth?
3. Pick your frontend framework: React, Vue, or Angular?
4. Decide on your deployment strategy: AWS, GCP, or Azure?
5. Determine your testing approach: Unit tests, integration tests, or both?""",

        """For your project setup, I have several questions:

What programming language would you prefer?
Which database technology works best for your needs?
Do you want to include automated testing?
Should we set up continuous integration?
Would you like to add monitoring and logging?""",

        """Here are the next steps:

Should we proceed with the implementation?
Do you want to review the plan first?
Would you like me to explain the technical details?
Are you ready to start coding?"""
    ]

    print("=" * 70)
    print("SIMPLE DECISION FLOWS DEMONSTRATION")
    print("=" * 70)

    for i, original_response in enumerate(test_responses, 1):
        print(f"\n--- Example {i} ---")
        print("Original Response:")
        print(original_response)

        # Validate original
        original_validation = validator.validate_compliance(original_response)
        print(f"\nOriginal Validation: {original_validation}")

        if not original_validation["compliant"]:
            # Simplify the response
            simplified_response, new_metrics = simplifier.simplify_to_three_decisions(original_response)

            print(f"\nSimplified Response:")
            print(simplified_response)

            # Validate simplified
            simplified_validation = validator.validate_compliance(simplified_response)
            print(f"\nSimplified Validation: {simplified_validation}")

            print(f"\nImprovement Summary:")
            print(f"  Decisions reduced: {original_validation['total_decisions']} → {simplified_validation['total_decisions']}")
            print(f"  Complexity reduced: {original_validation['complexity_score']:.2f} → {simplified_validation['complexity_score']:.2f}")
            print(f"  Cognitive load reduced: {original_validation['cognitive_load']:.2f} → {simplified_validation['cognitive_load']:.2f}")

if __name__ == "__main__":
    asyncio.run(demo_simple_flows())