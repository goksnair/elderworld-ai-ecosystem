#!/usr/bin/env python3
"""
AUTOMATIC STRATEGIC FILTERING TEST SUITE
Verifies that strategic directives trigger automatic analysis mode
"""

import sys
import re
from typing import Dict, List, Tuple

class StrategicFilteringTester:
    """
    Tests automatic strategic filtering protocol implementation
    """
    
    def __init__(self):
        # Define strategic directive patterns
        self.strategic_patterns = [
            r'operational sequence|priority|strategic',
            r'coordination|alignment|phase-based',
            r'Gemini.*(steps|multi-step|breakdown)',
            r'business.*(operations|healthcare systems)',
            r'protocol.*(failure|repair|fix)',
            r'task categorization|priority ranking',
            r'competitive.*(positioning|response)'
        ]
        
        self.test_cases = [
            # Should trigger STRATEGIC_MODE
            ("Gemini provided 4-step sequence for coordination", "STRATEGIC_MODE"),
            ("We need priority ranking for business operations", "STRATEGIC_MODE"),
            ("Multi-step operational sequence validation required", "STRATEGIC_MODE"),
            ("Cross-functional coordination for phase-based alignment", "STRATEGIC_MODE"),
            ("Protocol failure correction needed immediately", "STRATEGIC_MODE"),
            ("Task categorization with competitive positioning analysis", "STRATEGIC_MODE"),
            ("Business operations before healthcare systems approach", "STRATEGIC_MODE"),
            
            # Should trigger SIMPLE_MODE
            ("What time is the meeting?", "SIMPLE_MODE"),
            ("Show me the current dashboard", "SIMPLE_MODE"),
            ("Update the documentation", "SIMPLE_MODE"),
            ("How do I run tests?", "SIMPLE_MODE"),
            ("Create a simple component", "SIMPLE_MODE")
        ]

    def classify_input(self, user_input: str) -> str:
        """
        Classify user input as STRATEGIC_MODE or SIMPLE_MODE
        """
        user_input_lower = user_input.lower()
        
        # Check for strategic patterns
        for pattern in self.strategic_patterns:
            if re.search(pattern, user_input_lower, re.IGNORECASE):
                return "STRATEGIC_MODE"
        
        return "SIMPLE_MODE"

    def run_test(self, input_text: str, expected: str) -> Tuple[bool, str]:
        """
        Run single test case
        """
        actual = self.classify_input(input_text)
        success = actual == expected
        
        result = f"✅ PASS" if success else f"❌ FAIL"
        details = f"Input: '{input_text}' | Expected: {expected} | Actual: {actual}"
        
        return success, f"{result} - {details}"

    def run_all_tests(self) -> Dict:
        """
        Run complete test suite
        """
        results = {
            'passed': 0,
            'failed': 0,
            'total': len(self.test_cases),
            'details': []
        }
        
        print("🧪 RUNNING STRATEGIC FILTERING TEST SUITE")
        print("=" * 60)
        
        for input_text, expected in self.test_cases:
            success, details = self.run_test(input_text, expected)
            results['details'].append(details)
            
            if success:
                results['passed'] += 1
            else:
                results['failed'] += 1
            
            print(details)
        
        print("=" * 60)
        print(f"📊 RESULTS: {results['passed']}/{results['total']} tests passed")
        
        if results['failed'] > 0:
            print(f"🚨 {results['failed']} tests FAILED - Protocol repair required")
        else:
            print("✅ All tests PASSED - Strategic filtering working correctly")
        
        return results

def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Test Strategic Filtering Protocol')
    parser.add_argument('--input', help='Test specific input string')
    parser.add_argument('--expect', help='Expected result (STRATEGIC_MODE or SIMPLE_MODE)')
    parser.add_argument('--all', action='store_true', help='Run all tests')
    
    args = parser.parse_args()
    
    tester = StrategicFilteringTester()
    
    if args.input and args.expect:
        success, result = tester.run_test(args.input, args.expect)
        print(result)
        sys.exit(0 if success else 1)
    
    elif args.all:
        results = tester.run_all_tests()
        sys.exit(0 if results['failed'] == 0 else 1)
    
    else:
        # Default: run all tests
        results = tester.run_all_tests()
        sys.exit(0 if results['failed'] == 0 else 1)

if __name__ == '__main__':
    main()