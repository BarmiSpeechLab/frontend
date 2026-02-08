import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './ResultCarousel.css';

const ResultCarousel = ({ children, titles = [] }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const count = React.Children.count(children);

    const nextSlide = () => {
        if (currentIndex < count - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    const prevSlide = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    return (
        <div className="result-carousel-container">
            <div className="carousel-header">
                <h3 className="carousel-title">{titles[currentIndex] || '분석 결과'}</h3>
            </div>

            <div className="carousel-viewport">
                <div
                    className="carousel-track"
                    style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                >
                    {React.Children.map(children, (child, index) => (
                        <div className="carousel-slide" key={index}>
                            <div className="carousel-card-wrapper">
                                {child}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <button
                className={`carousel-nav-btn prev ${currentIndex === 0 ? 'disabled' : ''}`}
                onClick={prevSlide}
                disabled={currentIndex === 0}
            >
                <ChevronLeft size={24} />
            </button>
            <button
                className={`carousel-nav-btn next ${currentIndex === count - 1 ? 'disabled' : ''}`}
                onClick={nextSlide}
                disabled={currentIndex === count - 1}
            >
                <ChevronRight size={24} />
            </button>

            <div className="carousel-dots">
                {Array.from({ length: count }).map((_, idx) => (
                    <div
                        key={idx}
                        className={`dot ${currentIndex === idx ? 'active' : ''}`}
                        onClick={() => setCurrentIndex(idx)}
                    />
                ))}
            </div>
        </div>
    );
};

export default ResultCarousel;
