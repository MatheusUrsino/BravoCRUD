import { useTheme } from "@/context/ThemeContext";
import { MdDarkMode, MdLightMode } from "react-icons/md";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function ThemeToggleButton() {
    const { theme, toggleTheme } = useTheme();
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [isAnimating, setIsAnimating] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    const handleThemeToggle = () => {
        if (isAnimating) return;
        setIsAnimating(true);
        toggleTheme();
    };

    useEffect(() => {
        if (!buttonRef.current) return;

        const button = buttonRef.current;

        const handleAnimationEnd = () => {
            setIsAnimating(false);
            button.removeEventListener('transitionend', handleAnimationEnd);
        };

        button.addEventListener('transitionend', handleAnimationEnd);

        return () => {
            button.removeEventListener('transitionend', handleAnimationEnd);
        };
    }, [theme]);

    const themeColors = {
        light: {
            bg: "#ffffff",
            icon: "#FFD600",
            iconOutline: "#000000", // Cor do contorno para o sol
            hoverBg: "#f0f0f0",
            border: "#e5e7eb"
        },
        dark: {
            bg: "#1f2937",
            icon: "#ffffff",
            iconOutline: "transparent", // Sem contorno para a lua
            hoverBg: "#374151",
            border: "#4b5563"
        }
    };

    const currentColors = theme === "dark" ? themeColors.dark : themeColors.light;

    return (
        <motion.button
            ref={buttonRef}
            aria-label={`Alternar para tema ${theme === "dark" ? "claro" : "escuro"}`}
            onClick={handleThemeToggle}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`
        fixed bottom-6 right-6 z-50
        rounded-full shadow-lg p-1
        border-2
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
        transition-all duration-300 ease-in-out
      `}
            style={{
                backgroundColor: currentColors.bg,
                borderColor: currentColors.border
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            initial={false}
            animate={{
                backgroundColor: isHovered ? currentColors.hoverBg : currentColors.bg
            }}
            transition={{
                duration: 0.3,
                ease: "easeInOut"
            }}
        >
            <AnimatePresence mode="wait">
                <motion.div
                    key={theme}
                    initial={{ opacity: 0, rotate: -90 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    exit={{ opacity: 0, rotate: 90 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                    {theme === "dark" ? (
                        <MdDarkMode
                            color={currentColors.icon}
                            fill={currentColors.icon}
                            className="w-10 h-10"
                        />
                    ) : (
                        <div className="relative flex items-center justify-center w-10 h-10">
                            <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="60" height="60" viewBox="0 0 48 48">
                                <circle cx="24" cy="24" r="16" fill="#f2ca00"></circle><path fill="#324561" d="M24,6c-0.553,0-1-0.447-1-1V1c0-0.553,0.447-1,1-1s1,0.447,1,1v4C25,5.553,24.553,6,24,6z"></path><path fill="#324561" d="M5,25H1c-0.553,0-1-0.447-1-1s0.447-1,1-1h4c0.553,0,1,0.447,1,1S5.553,25,5,25z"></path><path fill="#324561" d="M7.736,41.264c-0.256,0-0.512-0.098-0.707-0.293c-0.391-0.391-0.391-1.023,0-1.414l2.829-2.829	c0.391-0.391,1.023-0.391,1.414,0s0.391,1.023,0,1.414l-2.829,2.829C8.248,41.166,7.992,41.264,7.736,41.264z"></path><path fill="#324561" d="M10.565,11.565c-0.256,0-0.512-0.098-0.707-0.293L7.029,8.443c-0.391-0.391-0.391-1.023,0-1.414	s1.023-0.391,1.414,0l2.829,2.829c0.391,0.391,0.391,1.023,0,1.414C11.077,11.468,10.821,11.565,10.565,11.565z"></path><path fill="#324561" d="M37.435,11.565c-0.256,0-0.512-0.098-0.707-0.293c-0.391-0.391-0.391-1.023,0-1.414l2.829-2.829	c0.391-0.391,1.023-0.391,1.414,0s0.391,1.023,0,1.414l-2.829,2.829C37.946,11.468,37.69,11.565,37.435,11.565z"></path><path fill="#324561" d="M47,25h-4c-0.553,0-1-0.447-1-1s0.447-1,1-1h4c0.553,0,1,0.447,1,1S47.553,25,47,25z"></path><path fill="#324561" d="M40.264,41.264c-0.256,0-0.512-0.098-0.707-0.293l-2.829-2.829c-0.391-0.391-0.391-1.023,0-1.414	s1.023-0.391,1.414,0l2.829,2.829c0.391,0.391,0.391,1.023,0,1.414C40.775,41.166,40.52,41.264,40.264,41.264z"></path><path fill="#324561" d="M24,48c-0.553,0-1-0.447-1-1v-4c0-0.553,0.447-1,1-1s1,0.447,1,1v4C25,47.553,24.553,48,24,48z"></path>
                            </svg>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </motion.button>
    );
}