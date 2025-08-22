/**
 * ELDERBRIDGE BRAND CONFIGURATION
 * Implementing BEACON.AI theme principles for UI/UX consistency
 * Family-first design with guidance and connection as core themes
 */

const ElderWorldBrand = {
    name: 'ElderWorld',
    tagline: 'Bridging Hearts, Guiding Care',
    mission: 'Connecting families across distances with intelligent, compassionate eldercare that bridges generations',

    // BEACON.AI Inspired Color Palette
    colors: {
        // Primary Colors
        primary: {
            beacon: '#1E3A8A',        // Deep beacon blue - trust & reliability
            gold: '#F59E0B',          // Guiding gold - warmth & premium
            white: '#FFFFFF',         // Pure white - clarity & safety
            charcoal: '#374151'       // Family charcoal - sophistication
        },

        // Secondary Colors
        secondary: {
            lightBlue: '#3B82F6',     // Accessible blue for links
            sage: '#10B981',          // Health green - vitals & wellness
            warm: '#EF4444',          // Emergency red - alerts
            gray: {
                50: '#F9FAFB',
                100: '#F3F4F6',
                200: '#E5E7EB',
                300: '#D1D5DB',
                400: '#9CA3AF',
                500: '#6B7280',
                600: '#4B5563',
                700: '#374151',
                800: '#1F2937',
                900: '#111827'
            }
        },

        // Semantic Colors
        semantic: {
            success: '#10B981',       // Health indicators, positive states
            warning: '#F59E0B',       // Caution states, attention needed
            error: '#EF4444',         // Emergency alerts, critical issues
            info: '#3B82F6'           // Information, navigation
        },

        // Accessibility Colors (Senior-Friendly)
        accessibility: {
            highContrast: '#000000',
            largeText: '#1F2937',
            focusRing: '#3B82F6',
            emergencyHighlight: '#DC2626'
        }
    },

    // Typography System (Inter font family)
    typography: {
        fontFamily: {
            primary: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            monospace: "'JetBrains Mono', 'Fira Code', monospace"
        },

        fontSize: {
            xs: '12px',
            sm: '14px',
            base: '16px',
            lg: '18px',
            xl: '20px',
            '2xl': '24px',
            '3xl': '30px',
            '4xl': '36px',
            '5xl': '48px',

            // Senior-friendly larger sizes
            senior: {
                base: '20px',          // 25% larger than standard
                lg: '24px',
                xl: '28px',
                '2xl': '32px'
            }
        },

        fontWeight: {
            normal: '400',
            medium: '500',
            semibold: '600',
            bold: '700'
        },

        lineHeight: {
            tight: '1.2',
            normal: '1.5',
            relaxed: '1.7'
        }
    },

    // Spacing System
    spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        '2xl': '48px',
        '3xl': '64px',
        '4xl': '96px'
    },

    // Border Radius
    borderRadius: {
        none: '0',
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '24px',
        full: '9999px'
    },

    // Shadows
    shadows: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        beacon: '0 8px 32px rgba(30, 58, 138, 0.12)' // Beacon blue shadow
    },

    // Component Specific Styles
    components: {
        // Navigation & Header
        header: {
            backgroundColor: '#FFFFFF',
            borderColor: '#E5E7EB',
            logoColor: '#1E3A8A',
            textColor: '#374151'
        },

        // Cards & Containers
        card: {
            backgroundColor: '#FFFFFF',
            borderColor: '#E5E7EB',
            borderRadius: '12px',
            shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            padding: '24px'
        },

        // Buttons
        button: {
            primary: {
                backgroundColor: '#1E3A8A',
                color: '#FFFFFF',
                hoverBackgroundColor: '#1E40AF'
            },
            secondary: {
                backgroundColor: '#F59E0B',
                color: '#FFFFFF',
                hoverBackgroundColor: '#D97706'
            },
            emergency: {
                backgroundColor: '#EF4444',
                color: '#FFFFFF',
                hoverBackgroundColor: '#DC2626',
                shadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
            }
        },

        // Status Indicators
        status: {
            active: '#10B981',
            inactive: '#6B7280',
            emergency: '#EF4444',
            warning: '#F59E0B'
        }
    },

    // Brand Voice & Messaging
    voice: {
        tone: 'Warm, Professional, Reassuring',
        personality: ['Trustworthy', 'Intelligent', 'Compassionate', 'Reliable'],
        language: {
            avoid: ['Expensive', 'Complex', 'Medical jargon', 'Tech-heavy terms'],
            prefer: ['Connection', 'Peace of mind', 'Family-first', 'Guided care', 'Bridging distances']
        }
    },

    // UI/UX Guidelines
    ux: {
        // Touch Targets (Mobile)
        touchTarget: {
            minimum: '44px',
            recommended: '48px',
            senior: '56px'  // Larger for senior users
        },

        // Animation
        animation: {
            duration: {
                fast: '150ms',
                normal: '300ms',
                slow: '500ms'
            },
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
        },

        // Accessibility
        a11y: {
            minContrast: '4.5:1',
            seniorContrast: '7:1',
            focusIndicator: '2px solid #3B82F6',
            screenReaderText: true
        }
    }
};

// CSS Custom Properties Generator
ElderWorldBrand.generateCSSVariables = () => {
    return `
:root {
  /* Colors */
  --eb-primary: ${ElderWorldBrand.colors.primary.beacon};
  --eb-gold: ${ElderWorldBrand.colors.primary.gold};
  --eb-white: ${ElderWorldBrand.colors.primary.white};
  --eb-charcoal: ${ElderWorldBrand.colors.primary.charcoal};
  
  /* Semantic Colors */
  --eb-success: ${ElderWorldBrand.colors.semantic.success};
  --eb-warning: ${ElderWorldBrand.colors.semantic.warning};
  --eb-error: ${ElderWorldBrand.colors.semantic.error};
  --eb-info: ${ElderWorldBrand.colors.semantic.info};
  
  /* Typography */
  --eb-font-family: ${ElderWorldBrand.typography.fontFamily.primary};
  --eb-font-size-base: ${ElderWorldBrand.typography.fontSize.base};
  --eb-font-size-lg: ${ElderWorldBrand.typography.fontSize.lg};
  --eb-font-size-senior: ${ElderWorldBrand.typography.fontSize.senior.base};
  
  /* Spacing */
  --eb-space-sm: ${ElderWorldBrand.spacing.sm};
  --eb-space-md: ${ElderWorldBrand.spacing.md};
  --eb-space-lg: ${ElderWorldBrand.spacing.lg};
  --eb-space-xl: ${ElderWorldBrand.spacing.xl};
  
  /* Border Radius */
  --eb-radius-sm: ${ElderWorldBrand.borderRadius.sm};
  --eb-radius-md: ${ElderWorldBrand.borderRadius.md};
  --eb-radius-lg: ${ElderWorldBrand.borderRadius.lg};
  
  /* Shadows */
  --eb-shadow-sm: ${ElderWorldBrand.shadows.sm};
  --eb-shadow-md: ${ElderWorldBrand.shadows.md};
  --eb-shadow-lg: ${ElderWorldBrand.shadows.lg};
  --eb-shadow-beacon: ${ElderWorldBrand.shadows.beacon};
}
`;
};

// Export for use in components
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ElderWorldBrand;
}

if (typeof window !== 'undefined') {
    window.ElderWorldBrand = ElderWorldBrand;
}
