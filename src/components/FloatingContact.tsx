"use client";

import React from 'react';
import styles from './FloatingContact.module.css';

const FloatingContact = () => {
    return (
        <div className={styles.floatingContact}>
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
