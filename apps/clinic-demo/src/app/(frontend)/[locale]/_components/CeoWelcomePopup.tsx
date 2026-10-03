'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link'
import { useLocale } from 'next-intl'

function withLocale(locale: string, href: string): string {
    if (!href || href.startsWith('http') || href.startsWith('#')) return href
    const path = href.startsWith('/') ? href : `/${href}`
    return path.startsWith(`/${locale}/`) || path === `/${locale}` ? path : `/${locale}${path}`
}

// Static content — edit these values directly
const CEO_PHOTO_URL = '/CEO.png';
const BADGE_TEXT = '創業20年の実績';
const HEADLINE_LINE_1 = 'CEOより';
const HEADLINE_LINE_2 = 'ご挨拶';
const SUPPORTING_TEXT = `日本での新しい人生は、一歩踏み出す勇気から始まります。
私たちは皆さま一人ひとりの可能性を信じ、
夢の実現に向けて誠実にサポートします。
ともに未来を築いていきましょう。`;
const CTA_LABEL = 'メッセージを読む';
const CTA_HREF = '/about';
const POPUP_FREQUENCY: 'session' | 'once' | 'always' = 'session';

export function CeoWelcomePopup() {
    const [visible, setVisible] = useState(false);
    const locale = useLocale(); // <-- this is the missing piece

    useEffect(() => {
        if (POPUP_FREQUENCY === 'always') {
            setVisible(true);
            return;
        }

        const storageKey = 'ceo-welcome-popup-dismissed';
        const storage = POPUP_FREQUENCY === 'once' ? window.localStorage : window.sessionStorage;

        const alreadyDismissed = storage.getItem(storageKey);
        if (!alreadyDismissed) {
            const timer = setTimeout(() => setVisible(true), 600);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleClose = () => {
        setVisible(false);
        if (POPUP_FREQUENCY !== 'always') {
            const storageKey = 'ceo-welcome-popup-dismissed';
            const storage = POPUP_FREQUENCY === 'once' ? window.localStorage : window.sessionStorage;
            storage.setItem(storageKey, 'true');
        }
    };

    if (!visible) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
            onClick={handleClose}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-[380px] min-h-[480px] rounded-2xl overflow-hidden shadow-2xl bg-primary flex flex-col"
            >
                {/* Close button */}
                <button
                    onClick={handleClose}
                    aria-label="Close"
                    className="absolute top-2.5 right-2.5 z-20 w-7 h-7 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 text-white text-base transition-colors"
                >
                    &times;
                </button>



                {/* Color block content area */}
                <div className="relative pt-6 px-5 pb-1">
                    {/* Badge — nudged right */}
                    <span className="inline-block bg-white/15 text-white text-[11px] font-semibold px-3 py-1 rounded-full mb-3 ml-10">
                        {BADGE_TEXT}
                    </span>

                    {/* Headline — nudged right */}
                    <h2 className="text-white font-extrabold leading-tight mb-2 ml-10" style={{ fontSize: '2rem' }}>
                        {HEADLINE_LINE_1}
                        <br />
                        {HEADLINE_LINE_2}
                    </h2>

                    {/* CEO avatar — right edge */}
                    <div className="absolute right-[-8px] top-4 w-32 h-40 sm:w-36 sm:h-44">
                        <Image
                            src={CEO_PHOTO_URL}
                            alt="CEO"
                            fill
                            className="object-contain object-top"
                        />
                    </div>

                    {/* Spacer to clear the avatar's height */}
                    <div className="h-10 sm:h-14" />
                </div>

                {/* Highlighted supporting text bar — now close to the avatar */}
                <div className="mx-5 mt-0 mb-3 bg-brand-accent rounded-xl px-4 py-3">
                    <p className="text-white text-[18px] font-bold leading-snug whitespace-pre-line">
                        {SUPPORTING_TEXT}
                    </p>
                </div>

                {/* This absorbs the leftover space — card stays the same total height */}
                <div className="flex-grow" />

                {/* Bottom CTA — stays pinned to the bottom */}
                <div className="flex justify-center mb-5 mt-4">
                    <Link
                        href={withLocale(locale, CTA_HREF)}
                        onClick={handleClose}
                        className="inline-flex items-center justify-center gap-1.5 bg-white text-primary font-bold text-sm px-6 py-3 rounded-full shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
                    >
                        {CTA_LABEL}
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
                            <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </Link>
                </div>
            </div>
        </div>
    );
}