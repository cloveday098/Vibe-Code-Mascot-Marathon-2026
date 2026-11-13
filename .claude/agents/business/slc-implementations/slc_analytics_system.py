#!/usr/bin/env python3
"""
SLC Analytics and Success Metrics Tracking System
Tracks 70% context switch reduction goal and MRR growth progress
"""

import asyncio
import logging
import json
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
import statistics
from collections import defaultdict

logger = logging.getLogger(__name__)

@dataclass
class SLCMetrics:
    simple_score: float
    lovable_score: float
    complete_score: float
    overall_slc_score: float
    context_switches: int
    user_satisfaction: float

@dataclass
class UserInteraction:
    timestamp: datetime
    user_input_length: int
    response_length: int
    decisions_in_response: int
    fact_checks_applied: int
    human_check_ins: int
    delight_moments: int
    session_duration: float
    context_switches_detected: int
    completion_rate: float
    user_satisfaction_rating: Optional[float]

@dataclass
class MRRMetrics:
    total_users: int
    paying_users: int
    average_revenue_per_user: float
    monthly_recurring_revenue: float
    churn_rate: float
    acquisition_cost: float
    customer_lifetime_value: float
    revenue_growth_rate: float

class SLCAnalyticsEngine:
    """Core analytics engine for SLC framework metrics"""

    def __init__(self):
        self.interactions: List[UserInteraction] = []
        self.slc_history: List[SLCMetrics] = []
        self.baseline_context_switches = 0
        self.target_reduction = 0.7  # 70% reduction goal
        self.user_sessions = defaultdict(list)

    def record_interaction(self, interaction_data: Dict) -> None:
        """Record a user interaction for analytics"""
        interaction = UserInteraction(
            timestamp=datetime.now(),
            user_input_length=interaction_data.get('user_input_length', 0),
            response_length=interaction_data.get('response_length', 0),
            decisions_in_response=interaction_data.get('decisions_in_response', 0),
            fact_checks_applied=interaction_data.get('fact_checks_applied', 0),
            human_check_ins=interaction_data.get('human_check_ins', 0),
            delight_moments=interaction_data.get('delight_moments', 0),
            session_duration=interaction_data.get('session_duration', 0),
            context_switches_detected=interaction_data.get('context_switches_detected', 0),
            completion_rate=interaction_data.get('completion_rate', 0),
            user_satisfaction_rating=interaction_data.get('user_satisfaction_rating')
        )

        self.interactions.append(interaction)
        self._update_session_tracking(interaction)

    def _update_session_tracking(self, interaction: UserInteraction) -> None:
        """Update session tracking for context switch analysis"""
        session_key = interaction.timestamp.strftime("%Y-%m-%d")
        self.user_sessions[session_key].append(interaction)

    def calculate_slc_scores(self) -> SLCMetrics:
        """Calculate current SLC framework scores"""

        if not self.interactions:
            return SLCMetrics(0, 0, 0, 0, 0, 0)

        recent_interactions = self.interactions[-100:]  # Last 100 interactions

        # Simple score: ≤3 decisions per interaction (Shape Up 2025 p.89)
        simple_decisions = [i.decisions_in_response for i in recent_interactions]
        simple_compliance = sum(1 for d in simple_decisions if d <= 3) / len(simple_decisions)
        simple_score = simple_compliance * 5  # Scale to 1-5

        # Lovable score: Human check-ins, delight moments, and satisfaction
        lovable_factors = []
        for interaction in recent_interactions:
            human_factor = min(interaction.human_check_ins / 2, 1.0)  # Normalize
            delight_factor = min(interaction.delight_moments / 3, 1.0)
            satisfaction = interaction.user_satisfaction_rating or 3.5  # Default neutral
            lovable_score = (human_factor * 0.3 + delight_factor * 0.3 + satisfaction / 5 * 0.4)
            lovable_factors.append(lovable_score)

        lovable_score = statistics.mean(lovable_factors) * 5

        # Complete score: Fact-checking and reduced context switches
        complete_factors = []
        for interaction in recent_interactions:
            fact_check_coverage = min(interaction.fact_checks_applied / 3, 1.0)
            context_switch_reduction = self._calculate_context_switch_reduction()
            completion_bonus = interaction.completion_rate
            complete_score = (fact_check_coverage * 0.4 + context_switch_reduction * 0.4 + completion_bonus * 0.2)
            complete_factors.append(complete_score)

        complete_score = statistics.mean(complete_factors) * 5

        # Overall SLC score
        overall_slc_score = (simple_score + lovable_score + complete_score) / 3

        # Average context switches
        avg_context_switches = statistics.mean([i.context_switches_detected for i in recent_interactions])

        # User satisfaction
        satisfaction_ratings = [i.user_satisfaction_rating for i in recent_interactions if i.user_satisfaction_rating]
        avg_satisfaction = statistics.mean(satisfaction_ratings) if satisfaction_ratings else 3.0

        return SLCMetrics(
            simple_score=simple_score,
            lovable_score=lovable_score,
            complete_score=complete_score,
            overall_slc_score=overall_slc_score,
            context_switches=int(avg_context_switches),
            user_satisfaction=avg_satisfaction
        )

    def _calculate_context_switch_reduction(self) -> float:
        """Calculate context switch reduction percentage"""
        if len(self.interactions) < 50:
            return 0.0  # Not enough data

        # Calculate baseline (first 25% of interactions)
        baseline_count = int(len(self.interactions) * 0.25)
        baseline_interactions = self.interactions[:baseline_count]
        recent_interactions = self.interactions[-baseline_count:]

        baseline_avg = statistics.mean([i.context_switches_detected for i in baseline_interactions])
        recent_avg = statistics.mean([i.context_switches_detected for i in recent_interactions])

        if baseline_avg == 0:
            return 1.0

        reduction = (baseline_avg - recent_avg) / baseline_avg
        return max(0.0, min(1.0, reduction))

    def get_context_switch_metrics(self) -> Dict:
        """Get detailed context switch reduction metrics"""
        if not self.interactions:
            return {"message": "No interactions recorded yet"}

        # Calculate by time periods
        now = datetime.now()
        periods = {
            "last_hour": now - timedelta(hours=1),
            "last_24h": now - timedelta(days=1),
            "last_week": now - timedelta(weeks=1),
            "all_time": datetime.min
        }

        metrics = {}
        for period_name, start_time in periods.items():
            period_interactions = [i for i in self.interactions if i.timestamp >= start_time]

            if period_interactions:
                avg_context_switches = statistics.mean([i.context_switches_detected for i in period_interactions])
                total_switches = sum([i.context_switches_detected for i in period_interactions])

                metrics[period_name] = {
                    "avg_context_switches": avg_context_switches,
                    "total_switches": total_switches,
                    "interaction_count": len(period_interactions),
                    "reduction_from_baseline": self._calculate_period_reduction(period_interactions)
                }

        # Target progress
        current_metrics = self.calculate_slc_scores()
        reduction_percentage = self._calculate_context_switch_reduction()
        target_progress = reduction_percentage / self.target_reduction

        metrics["target_analysis"] = {
            "current_reduction_percentage": reduction_percentage * 100,
            "target_reduction_percentage": self.target_reduction * 100,
            "target_progress_percentage": target_progress * 100,
            "on_track_for_target": target_progress >= 1.0,
            "current_avg_context_switches": current_metrics.context_switches
        }

        return metrics

    def _calculate_period_reduction(self, interactions: List[UserInteraction]) -> float:
        """Calculate reduction for a specific period"""
        if len(self.interactions) < 20:
            return 0.0

        baseline_interactions = self.interactions[:min(20, len(self.interactions) // 4)]
        if not baseline_interactions:
            return 0.0

        baseline_avg = statistics.mean([i.context_switches_detected for i in baseline_interactions])
        period_avg = statistics.mean([i.context_switches_detected for i in interactions])

        if baseline_avg == 0:
            return 0.0

        return (baseline_avg - period_avg) / baseline_avg

class MRRAnalytics:
    """MRR growth tracking and analytics"""

    def __init__(self):
        self.user_tiers = {
            "starter": {"price": 49, "features": ["basic_fact_check", "simple_flows"]},
            "professional": {"price": 149, "features": ["advanced_fact_check", "human_check_ins", "analytics"]},
            "enterprise": {"price": 499, "features": ["full_slc_suite", "priority_support", "custom_integrations"]}
        }

        self.subscribers = defaultdict(int)
        self.churn_tracking = []
        self.acquisition_costs = []

    def record_subscription(self, tier: str, acquisition_cost: float = 0) -> None:
        """Record a new subscription"""
        self.subscribers[tier] += 1
        self.acquisition_costs.append(acquisition_cost)

    def record_churn(self, tier: str) -> None:
        """Record customer churn"""
        if self.subscribers[tier] > 0:
            self.subscribers[tier] -= 1
            self.churn_tracking.append(datetime.now())

    def calculate_mrr_metrics(self) -> MRRMetrics:
        """Calculate current MRR metrics"""
        total_users = sum(self.subscribers.values())
        paying_users = total_users

        # Calculate MRR
        monthly_revenue = 0
        for tier, count in self.subscribers.items():
            monthly_revenue += count * self.user_tiers[tier]["price"]

        # Average revenue per user
        avg_revenue = monthly_revenue / max(paying_users, 1)

        # Churn rate (last 30 days)
        thirty_days_ago = datetime.now() - timedelta(days=30)
        recent_churn = len([c for c in self.churn_tracking if c >= thirty_days_ago])
        churn_rate = recent_churn / max(total_users, 1) if total_users > 0 else 0

        # Average acquisition cost
        avg_acquisition_cost = statistics.mean(self.acquisition_costs) if self.acquisition_costs else 0

        # Customer lifetime value (simplified)
        if churn_rate > 0:
            clv = avg_revenue / churn_rate
        else:
            clv = avg_revenue * 24  # Assume 24 months if no churn

        # Revenue growth rate (simplified - would need historical data)
        revenue_growth_rate = 0.15  # 15% monthly growth target

        return MRRMetrics(
            total_users=total_users,
            paying_users=paying_users,
            average_revenue_per_user=avg_revenue,
            monthly_recurring_revenue=monthly_revenue,
            churn_rate=churn_rate,
            acquisition_cost=avg_acquisition_cost,
            customer_lifetime_value=clv,
            revenue_growth_rate=revenue_growth_rate
        )

    def get_growth_projections(self, months_ahead: int = 6) -> Dict:
        """Project MRR growth"""
        current_metrics = self.calculate_mrr_metrics()

        projections = []
        projected_mrr = current_metrics.monthly_recurring_revenue

        for month in range(1, months_ahead + 1):
            # Apply growth rate
            projected_mrr *= (1 + current_metrics.revenue_growth_rate)
            projected_users = int(current_metrics.total_users * (1 + current_metrics.revenue_growth_rate) ** month)

            projections.append({
                "month": month,
                "projected_mrr": projected_mrr,
                "projected_users": projected_users,
                "distance_to_10k": max(0, 10000 - projected_mrr)
            })

        # Target analysis
        target_month = next((p["month"] for p in projections if p["projected_mrr"] >= 10000), None)

        return {
            "projections": projections,
            "target_analysis": {
                "target_mrr": 10000,
                "months_to_target": target_month,
                "on_track_for_10k": target_month is not None and target_month <= 6,
                "current_mrr": current_metrics.monthly_recurring_revenue,
                "growth_rate": current_metrics.revenue_growth_rate
            }
        }

class SLCDashboard:
    """Comprehensive SLC dashboard for tracking all metrics"""

    def __init__(self):
        self.analytics_engine = SLCAnalyticsEngine()
        self.mrr_analytics = MRRAnalytics()

    def generate_comprehensive_report(self) -> Dict:
        """Generate comprehensive SLC and MRR report"""
        # Current SLC scores
        slc_metrics = self.analytics_engine.calculate_slc_scores()

        # Context switch metrics
        context_metrics = self.analytics_engine.get_context_switch_metrics()

        # MRR metrics
        mrr_metrics = self.mrr_analytics.calculate_mrr_metrics()

        # Growth projections
        growth_projections = self.mrr_analytics.get_growth_projections()

        # Overall health assessment
        health_score = self._calculate_overall_health(slc_metrics, context_metrics, mrr_metrics)

        return {
            "timestamp": datetime.now().isoformat(),
            "slc_scores": {
                "simple": round(slc_metrics.simple_score, 2),
                "lovable": round(slc_metrics.lovable_score, 2),
                "complete": round(slc_metrics.complete_score, 2),
                "overall": round(slc_metrics.overall_slc_score, 2)
            },
            "context_switch_reduction": context_metrics.get("target_analysis", {}),
            "mrr_metrics": {
                "current_mrr": round(mrr_metrics.monthly_recurring_revenue, 2),
                "total_users": mrr_metrics.total_users,
                "avg_revenue_per_user": round(mrr_metrics.average_revenue_per_user, 2),
                "churn_rate": round(mrr_metrics.churn_rate * 100, 2),
                "clv": round(mrr_metrics.customer_lifetime_value, 2)
            },
            "growth_projections": growth_projections.get("target_analysis", {}),
            "health_score": health_score,
            "recommendations": self._generate_recommendations(slc_metrics, context_metrics, mrr_metrics)
        }

    def _calculate_overall_health(self, slc_metrics: SLCMetrics, context_metrics: Dict, mrr_metrics: MRRMetrics) -> Dict:
        """Calculate overall project health score"""
        slc_health = slc_metrics.overall_slc_score / 5  # Normalize to 0-1

        context_health = context_metrics.get("target_analysis", {}).get("target_progress_percentage", 0) / 100

        # MRR health based on 10k target
        mrr_health = min(mrr_metrics.monthly_recurring_revenue / 10000, 1.0)

        overall_health = (slc_health * 0.4 + context_health * 0.3 + mrr_health * 0.3)

        return {
            "overall_score": round(overall_health, 3),
            "slc_component": round(slc_health, 3),
            "context_component": round(context_health, 3),
            "mrr_component": round(mrr_health, 3),
            "status": "healthy" if overall_health >= 0.7 else "needs_attention" if overall_health >= 0.4 else "critical"
        }

    def _generate_recommendations(self, slc_metrics: SLCMetrics, context_metrics: Dict, mrr_metrics: MRRMetrics) -> List[str]:
        """Generate actionable recommendations"""
        recommendations = []

        # SLC recommendations
        if slc_metrics.simple_score < 3.5:
            recommendations.append("Focus on reducing decision points to ≤3 per interaction (Simple)")

        if slc_metrics.lovable_score < 3.5:
            recommendations.append("Increase human check-ins and delight moments (Lovable)")

        if slc_metrics.complete_score < 3.5:
            recommendations.append("Enhance fact-checking coverage and automation (Complete)")

        # Context switch recommendations
        target_progress = context_metrics.get("target_analysis", {}).get("target_progress_percentage", 0) / 100
        if target_progress < 0.7:
            recommendations.append("Accelerate context switch reduction - focus on automated fact-checking")

        # MRR recommendations
        if mrr_metrics.monthly_recurring_revenue < 5000:
            recommendations.append("Increase user acquisition to meet MRR growth targets")

        if mrr_metrics.churn_rate > 0.1:
            recommendations.append("Address user churn - improve product value and user experience")

        return recommendations

    def export_metrics_to_json(self, filename: str = None) -> str:
        """Export metrics to JSON file"""
        if filename is None:
            filename = f"slc_metrics_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"

        report = self.generate_comprehensive_report()

        with open(filename, 'w') as f:
            json.dump(report, f, indent=2, default=str)

        return filename

# Example usage and testing
async def demo_analytics():
    """Demonstrate analytics system"""
    dashboard = SLCDashboard()

    # Simulate some interactions
    sample_interactions = [
        {
            "user_input_length": 45,
            "response_length": 280,
            "decisions_in_response": 2,
            "fact_checks_applied": 1,
            "human_check_ins": 1,
            "delight_moments": 0,
            "session_duration": 120.5,
            "context_switches_detected": 1,
            "completion_rate": 0.9,
            "user_satisfaction_rating": 4.2
        },
        {
            "user_input_length": 32,
            "response_length": 195,
            "decisions_in_response": 3,
            "fact_checks_applied": 2,
            "human_check_ins": 0,
            "delight_moments": 1,
            "session_duration": 89.3,
            "context_switches_detected": 0,
            "completion_rate": 1.0,
            "user_satisfaction_rating": 4.7
        },
        {
            "user_input_length": 67,
            "response_length": 340,
            "decisions_in_response": 1,
            "fact_checks_applied": 3,
            "human_check_ins": 1,
            "delight_moments": 1,
            "session_duration": 156.2,
            "context_switches_detected": 0,
            "completion_rate": 0.85,
            "user_satisfaction_rating": 4.5
        }
    ]

    # Record interactions
    for interaction in sample_interactions:
        dashboard.analytics_engine.record_interaction(interaction)

    # Add some subscribers
    dashboard.mrr_analytics.record_subscription("starter", 25.0)
    dashboard.mrr_analytics.record_subscription("professional", 45.0)
    dashboard.mrr_analytics.record_subscription("starter", 30.0)
    dashboard.mrr_analytics.record_subscription("enterprise", 120.0)

    # Generate comprehensive report
    report = dashboard.generate_comprehensive_report()

    print("=" * 80)
    print("SLC ANALYTICS DASHBOARD")
    print("=" * 80)

    print(f"\n📊 SLC SCORES:")
    print(f"  Simple: {report['slc_scores']['simple']}/5")
    print(f"  Lovable: {report['slc_scores']['lovable']}/5")
    print(f"  Complete: {report['slc_scores']['complete']}/5")
    print(f"  Overall: {report['slc_scores']['overall']}/5")

    print(f"\n🔄 CONTEXT SWITCH REDUCTION:")
    context_data = report['context_switch_reduction']
    print(f"  Current Reduction: {context_data.get('current_reduction_percentage', 0):.1f}%")
    print(f"  Target Reduction: {context_data.get('target_reduction_percentage', 0):.1f}%")
    print(f"  Progress to Target: {context_data.get('target_progress_percentage', 0):.1f}%")
    print(f"  On Track: {context_data.get('on_track_for_target', False)}")

    print(f"\n💰 MRR METRICS:")
    mrr_data = report['mrr_metrics']
    print(f"  Current MRR: ${mrr_data['current_mrr']:,.2f}")
    print(f"  Total Users: {mrr_data['total_users']}")
    print(f"  Avg Revenue/User: ${mrr_data['avg_revenue_per_user']:.2f}")
    print(f"  Churn Rate: {mrr_data['churn_rate']:.1f}%")

    print(f"\n📈 GROWTH PROJECTIONS:")
    growth_data = report['growth_projections']
    print(f"  Target: ${growth_data.get('target_mrr', 0):,.0f}")
    print(f"  Months to Target: {growth_data.get('months_to_target', 'N/A')}")
    print(f"  On Track for $10k: {growth_data.get('on_track_for_10k', False)}")

    print(f"\n🏥 OVERALL HEALTH:")
    health_data = report['health_score']
    print(f"  Health Score: {health_data['overall_score']:.1%}")
    print(f"  Status: {health_data['status'].upper()}")
    print(f"  SLC Component: {health_data['slc_component']:.1%}")
    print(f"  Context Component: {health_data['context_component']:.1%}")
    print(f"  MRR Component: {health_data['mrr_component']:.1%}")

    print(f"\n💡 RECOMMENDATIONS:")
    for i, rec in enumerate(report['recommendations'], 1):
        print(f"  {i}. {rec}")

    # Export to JSON
    filename = dashboard.export_metrics_to_json()
    print(f"\n📄 Detailed report exported to: {filename}")

if __name__ == "__main__":
    asyncio.run(demo_analytics())