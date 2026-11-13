#!/usr/bin/env python3
"""
Human-Centered UX Enhancement for Lovable SLC Implementation
Implements gentle phrasing, empathy patterns, and "made me smile" experiences
"""

import asyncio
import logging
import random
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
from datetime import datetime
import re

logger = logging.getLogger(__name__)

@dataclass
class UserState:
    frustration_level: float
    engagement_level: float
    success_momentum: int
    hesitation_detected: bool
    task_complexity: str
    last_interaction: datetime

@dataclass
class UXEnhancement:
    encouragement_message: str
    empathy_level: float
    delight_factor: float
    competence_recognition: str
    anticipatory_guidance: str

class EmpathyPatternAnalyzer:
    """Analyzes user state for appropriate emotional responses"""

    def __init__(self):
        self.frustration_keywords = [
            "stuck", "confused", "help", "problem", "error", "fail",
            "difficult", "hard", "impossible", "can't", "won't", "wrong"
        ]

        self.hesitation_patterns = [
            r"\?", r"maybe", r"perhaps", r"not sure", r"uncertain",
            r"think about", r"consider", r"might", r"could"
        ]

        self.success_indicators = [
            "great", "excellent", "perfect", "worked", "success",
            "finally", "got it", "understand", "clear", "yes"
        ]

    def analyze_user_state(self, user_input: str, previous_state: UserState) -> UserState:
        """Analyze user input to determine emotional state"""
        input_lower = user_input.lower()

        # Calculate frustration level
        frustration_count = sum(1 for word in self.frustration_keywords if word in input_lower)
        frustration_level = min(frustration_count * 0.2, 1.0)

        # Detect hesitation
        hesitation_detected = any(re.search(pattern, input_lower) for pattern in self.hesitation_patterns)

        # Assess engagement level
        engagement_level = 1.0 - frustration_level
        if len(user_input) < 10:
            engagement_level *= 0.8  # Short responses might indicate low engagement

        # Detect success momentum
        success_count = sum(1 for word in self.success_indicators if word in input_lower)
        momentum_change = 1 if success_count > 0 else -1 if frustration_count > 0 else 0

        # Determine task complexity
        task_complexity = self._assess_task_complexity(user_input)

        return UserState(
            frustration_level=frustration_level,
            engagement_level=engagement_level,
            success_momentum=previous_state.success_momentum + momentum_change,
            hesitation_detected=hesitation_detected,
            task_complexity=task_complexity,
            last_interaction=datetime.now()
        )

    def _assess_task_complexity(self, user_input: str) -> str:
        """Assess the complexity of the user's task"""
        # Simple heuristic for task complexity
        technical_terms = ["api", "code", "function", "database", "algorithm", "system"]
        complex_phrases = ["how do i", "help me understand", "explain", "tutorial"]

        if any(term in user_input.lower() for term in technical_terms):
            return "technical"
        elif any(phrase in user_input.lower() for phrase in complex_phrases):
            return "learning"
        elif len(user_input.split()) > 15:
            return "detailed"
        else:
            return "simple"

class DelightEngine:
    """Creates delightful human check-ins and moments of delight"""

    def __init__(self):
        self.gentle_encouragement = [
            "I can see this is challenging, and you're doing great. Let's take this step by step.",
            "You're making good progress. I'm here to help you succeed with this.",
            "This is a complex task, and you're handling it well.",
            "I appreciate your patience working through this. We'll get there together.",
            "Your approach shows real thoughtfulness. Let me help guide you to the solution."
        ]

        self.competence_praise = [
            "That's a smart question - it shows you're thinking deeply about this.",
            "You've got a good instinct for asking the right questions.",
            "I can see you're building a solid understanding here.",
            "Your attention to detail is really going to help you succeed.",
            "You're learning quickly! That's impressive."
        ]

        self.anticipatory_guidance = [
            "As you work through this, you might find it helpful to remember that...",
            "Based on what you're asking about, you'll probably want to focus on...",
            "I can see where you're heading with this. A useful tip might be...",
            "You're on the right track. The next logical step would likely be...",
            "Since you're exploring this area, you might also want to consider..."
        ]

        self.made_me_smile_moments = [
            "🌟 That's a really insightful observation!",
            "💡 Your question just sparked a great connection for me.",
            "🎯 You've pinpointed exactly the right issue to focus on.",
            "🚀 I love how you're thinking about this - it's creative and effective.",
            "✨ That's the kind of thinking that leads to breakthrough solutions!"
        ]

    def generate_delight_moment(self, user_input: str, user_state: UserState) -> Optional[str]:
        """Generate a delightful moment based on user interaction"""

        # Check for exceptional insight or cleverness
        insight_indicators = [
            "interesting", "noticed", "realized", "figured out",
            "connection", "pattern", "aha", "suddenly understood"
        ]

        if any(indicator in user_input.lower() for indicator in insight_indicators):
            return random.choice(self.made_me_smile_moments)

        return None

    def add_encouragement(self, response: str, user_state: UserState) -> str:
        """Add appropriate encouragement to the response"""

        if user_state.frustration_level > 0.6:
            # High frustration - provide gentle encouragement
            encouragement = random.choice(self.gentle_encouragement)
            return f"{encouragement}\n\n{response}"

        elif user_state.success_momentum > 2:
            # Building success - recognize competence
            praise = random.choice(self.competence_praise)
            return f"{response}\n\n{praise}"

        elif user_state.hesitation_detected:
            # User hesitating - provide anticipatory guidance
            guidance = random.choice(self.anticipatory_guidance)
            return f"{guidance} {response}"

        return response

class DecisionFlowSimplifier:
    """Simplifies user flows to meet ≤3-decision path requirement (Shape Up 2025 p.89)"""

    def __init__(self):
        self.decision_patterns = {
            "simple": "Would you like to proceed with this approach?",
            "binary": "Should we continue with option A or option B?",
            "progressive": "What's the next step you'd like to focus on?"
        }

    def simplify_response(self, complex_response: str) -> Tuple[str, int]:
        """Simplify response to meet ≤3-decision path requirement"""

        # Count decision points (questions, choices, options)
        questions = re.findall(r'\?', complex_response)
        options = re.findall(r'\b(?:option|choice|select|choose)\b', complex_response.lower())

        total_decisions = len(questions) + len(options)

        if total_decisions <= 3:
            return complex_response, total_decisions

        # Simplify to 3 or fewer decisions
        simplified = self._reduce_decisions(complex_response)
        actual_decisions = min(3, total_decisions)

        return simplified, actual_decisions

    def _reduce_decisions(self, text: str) -> str:
        """Reduce the number of decisions in the response"""
        lines = text.split('\n')
        simplified_lines = []
        decision_count = 0

        for line in lines:
            if '?' in line or any(word in line.lower() for word in ['option', 'choice', 'select']):
                if decision_count >= 3:
                    # Replace additional decisions with statement
                    if '?' in line:
                        line = line.replace('?', '.')
                    line = re.sub(r'\b(option|choice|select|choose)\b', 'consider', line, flags=re.IGNORECASE)
                else:
                    decision_count += 1

            simplified_lines.append(line)

        return '\n'.join(simplified_lines)

class LovableUXOrchestrator:
    """Orchestrates all lovable UX enhancements"""

    def __init__(self):
        self.empathy_analyzer = EmpathyPatternAnalyzer()
        self.delight_engine = DelightEngine()
        self.decision_simplifier = DecisionFlowSimplifier()
        self.user_history = []

    async def enhance_interaction(self,
                                user_input: str,
                                ai_response: str,
                                context: str = "") -> Tuple[str, Dict]:
        """Main method to enhance user interaction with lovable UX"""

        # Get or create user state
        previous_state = self.user_history[-1] if self.user_history else self._initial_state()
        current_state = self.empathy_analyzer.analyze_user_state(user_input, previous_state)

        # Apply enhancements
        enhanced_response = ai_response

        # 1. Add delight moments
        delight_moment = self.delight_engine.generate_delight_moment(user_input, current_state)
        if delight_moment:
            enhanced_response = f"{delight_moment}\n\n{enhanced_response}"

        # 2. Add encouragement
        enhanced_response = self.delight_engine.add_encouragement(enhanced_response, current_state)

        # 3. Simplify decision paths
        simplified_response, decision_count = self.decision_simplifier.simplify_response(enhanced_response)

        # 4. Add human check-ins for complex tasks
        if current_state.task_complexity == "technical" and current_state.frustration_level > 0.3:
            simplified_response = self._add_human_check_in(simplified_response, current_state)

        # Store user state
        self.user_history.append(current_state)

        # Create enhancement metrics
        enhancement_metrics = {
            "delight_moments": 1 if delight_moment else 0,
            "encouragement_added": current_state.frustration_level > 0.3,
            "decisions_simplified": decision_count < 5,
            "human_check_in": current_state.task_complexity == "technical" and current_state.frustration_level > 0.3,
            "empathy_level": current_state.frustration_level,
            "delight_factor": 0.8 if delight_moment else 0.4
        }

        return simplified_response, enhancement_metrics

    def _add_human_check_in(self, response: str, user_state: UserState) -> str:
        """Add human check-ins for complex or frustrating tasks"""

        check_ins = [
            "I know technical tasks can sometimes feel overwhelming. How are you feeling about the progress so far?",
            "Before we continue, I want to make sure this approach makes sense to you. Does this direction feel right?",
            "You've been working hard on this. Would it help to take a moment to review what we've accomplished?",
            "I want to make sure I'm supporting you well. Is there anything about this that still feels unclear?"
        ]

        check_in = random.choice(check_ins)
        return f"{response}\n\n💭 {check_in}"

    def _initial_state(self) -> UserState:
        """Create initial user state"""
        return UserState(
            frustration_level=0.0,
            engagement_level=1.0,
            success_momentum=0,
            hesitation_detected=False,
            task_complexity="simple",
            last_interaction=datetime.now()
        )

    def get_ux_metrics(self) -> Dict:
        """Get UX enhancement metrics"""
        if not self.user_history:
            return {"message": "No user interactions yet"}

        recent_states = self.user_history[-10:]
        avg_frustration = sum(state.frustration_level for state in recent_states) / len(recent_states)
        avg_engagement = sum(state.engagement_level for state in recent_states) / len(recent_states)
        total_momentum = sum(state.success_momentum for state in recent_states)

        return {
            "avg_frustration_level": avg_frustration,
            "avg_engagement_level": avg_engagement,
            "total_success_momentum": total_momentum,
            "interaction_count": len(self.user_history),
            "delight_opportunities": len([s for s in recent_states if s.success_momentum > 2])
        }

# Example usage
async def demo_lovable_ux():
    """Demonstrate lovable UX enhancements"""
    orchestrator = LovableUXOrchestrator()

    # Example interactions
    test_interactions = [
        ("I'm stuck on this API integration and can't figure out the authentication",
         "To fix the API authentication, you'll need to check your API key configuration and ensure proper headers are set. Would you like me to help you debug step by step, or should we review the documentation first?"),

        ("That's a really interesting point about database optimization",
         "Database optimization is crucial for performance. You mentioned indexing strategies - have you considered how your query patterns affect the optimal index configuration?"),

        ("I'm not sure if I should use React or Vue for my new project",
         "Both React and Vue have excellent documentation and strong communities. React has more job opportunities currently, while Vue is often considered easier to learn. What's your primary consideration for this project?"),
    ]

    print("=" * 70)
    print("LOVABLE UX ENHANCEMENT DEMONSTRATION")
    print("=" * 70)

    for i, (user_input, ai_response) in enumerate(test_interactions, 1):
        print(f"\n--- Interaction {i} ---")
        print(f"User: {user_input}")
        print(f"Original AI: {ai_response}")

        # Enhance with lovable UX
        enhanced_response, metrics = await orchestrator.enhance_interaction(user_input, ai_response)

        print(f"\nEnhanced AI: {enhanced_response}")
        print(f"Metrics: {metrics}")

    # Show overall UX metrics
    print(f"\n--- Overall UX Metrics ---")
    ux_metrics = orchestrator.get_ux_metrics()
    for key, value in ux_metrics.items():
        print(f"{key}: {value}")

if __name__ == "__main__":
    asyncio.run(demo_lovable_ux())