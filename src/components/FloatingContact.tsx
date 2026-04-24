"use client";

import React, { useEffect, useRef } from 'react';
import styles from './FloatingContact.module.css';

const FloatingContact = () => {
    const contactRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleScroll = () => {
            const footer = document.querySelector('footer');
            if (footer && contactRef.current) {
                const footerRect = footer.getBoundingClientRect();
                const windowHeight = window.innerHeight;
                if (footerRect.top < windowHeight) {
                    const overlap = windowHeight - footerRect.top;
                    const baseBottom = window.innerWidth <= 768 ? 20 : 30;
                    contactRef.current.style.bottom = `${baseBottom + overlap}px`;
                } else {
                    contactRef.current.style.bottom = '';
                }
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('resize', handleScroll, { passive: true });
        handleScroll();

        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleScroll);
        };
    }, []);

    return (
        <div ref={contactRef} className={styles.floatingContact}>
            <p className={styles.label}>Contact Us</p>
            <a href="mailto:crownship797@gmail.com" className={styles.email}>
                <svg 
                    className={styles.emailIcon} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24" 
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" 
                    />
                </svg>
                crownship797@gmail.com
            </a>
        </div>
    );
};

export default FloatingContact;
