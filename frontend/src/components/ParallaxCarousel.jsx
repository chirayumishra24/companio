import { useRef, useEffect } from "react";
import { motion, useAnimation, useMotionValue } from "framer-motion";

const CAROUSEL_RADIUS = 350; // Increased radius for better spacing
const ITEM_WIDTH = 260;
const ITEM_HEIGHT = 380;

export default function ParallaxCarousel({ items }) {
    const containerRef = useRef(null);
    const controls = useAnimation();
    const rotationY = useMotionValue(0);
    const Motion = motion;

    useEffect(() => {
        controls.start({
            rotateY: 360,
            transition: {
                repeat: Infinity,
                ease: "linear",
                duration: 45, // Much slower rotation
            },
        });
    }, [controls]);

    const handleMouseEnter = () => {
        controls.stop();
    };

    const handleMouseLeave = () => {
        controls.start({
            rotateY: rotationY.get() + 360,
            transition: {
                repeat: Infinity,
                ease: "linear",
                duration: 45,
            },
        });
    };

    const handleDrag = (_, info) => {
        // Stop auto-rotation on drag
        controls.stop();
        // Increase rotation based on drag offset
        rotationY.set(rotationY.get() + info.delta.x * 0.3); // Smoother drag delta
    };

    const handleDragEnd = () => {
        handleMouseLeave(); // Reuse logic to restart auto-rotation
    };

    return (
        <div
            className="relative w-full overflow-hidden flex flex-col items-center justify-center py-24"
            style={{ perspective: "2000px" }} // Increased perspective to prevent "spinning out"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >

            <Motion.div
                ref={containerRef}
                className="relative flex items-center justify-center cursor-grab active:cursor-grabbing"
                style={{
                    width: ITEM_WIDTH,
                    height: ITEM_HEIGHT,
                    transformStyle: "preserve-3d",
                    rotateY: rotationY,
                }}
                drag="x"
                onDrag={handleDrag}
                onDragEnd={handleDragEnd}
                animate={controls}
            >
                {items.map((item, index) => {
                    // Calculate the angle for each item in the 3D cylinder
                    const angle = (360 / items.length) * index;
                    return (
                        <Motion.div
                            key={item.id}
                            className="absolute flex flex-col items-center justify-center p-6 border-4 border-black shadow-brutal neo-card select-none"
                            style={{
                                width: ITEM_WIDTH,
                                height: ITEM_HEIGHT,
                                // Position in 3D space
                                transform: `rotateY(${angle}deg) translateZ(${CAROUSEL_RADIUS}px)`,
                                backgroundColor: item.color || "#fff",
                            }}
                        >
                            <h3 className="text-xl font-black uppercase mb-4 border-b-4 border-black pb-2 text-center w-full block truncate">
                                {item.author}
                            </h3>

                            <p className="font-bold text-base text-center overflow-hidden flex-1">
                                "{item.review}"
                            </p>

                            <div className="mt-4 bg-black text-white px-3 py-1 font-bold text-sm transform rotate-2">
                                ★ {item.rating}/5
                            </div>
                        </Motion.div>
                    );
                })}
            </Motion.div>
        </div>
    );
}
