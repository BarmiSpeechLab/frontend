import { useEffect, useRef } from 'react';

const useScrollAnimation = (deps = []) => {
    const containerRef = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                        // Optional: Unobserve after visible if you want it to animate only once
                        // observer.unobserve(entry.target); 
                    }
                });
            },
            { threshold: 0.1 } // Trigger when 10% visible
        );

        if (containerRef.current) {
            // Select all elements with .anim-target inside the container
            const targets = containerRef.current.querySelectorAll('.anim-target');
            targets.forEach((target) => observer.observe(target));
        }

        return () => observer.disconnect();
    }, deps);

    return containerRef;
};

export default useScrollAnimation;
