"use client";
import Link from "next/link";
import styles from "./Navbar.module.css";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const { user, logout, loading } = useAuth();

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ""}`}>
            <div className={styles.container}>
                <Link href="/" className={styles.logo}>
                    Crownship
                </Link>
                <div className={styles.links}>
                    <Link href="/shop" className={styles.link}>Marketplace</Link>
                    <Link href="/cart" className={styles.link}>Cart</Link>

                    {!loading && (
                        user ? (
                            <div className={styles.userSection}>
                                <span className={styles.userName}>Hello! {user.name}</span>
                                <button onClick={logout} className={styles.logoutBtn}>Logout</button>
                            </div>
                        ) : (
                            <Link href="/login" className={styles.loginBtn}>Login</Link>
                        )
                    )}
                </div>
            </div>
        </nav>
    );
}
