/**
 * EzyDrive Rentals - Home Page Script
 * Pure Vanilla JavaScript
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Sticky Header on Scroll
    const header = document.getElementById('mainHeader');
    if (header) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 20) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }

    // 2. Mobile Navigation Toggle
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.getElementById('navLinks');

    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('open');
            const isOpen = navLinks.classList.contains('open');
            menuToggle.setAttribute('aria-expanded', isOpen);
            menuToggle.textContent = isOpen ? '✕' : '☰';
        });
    }
});
