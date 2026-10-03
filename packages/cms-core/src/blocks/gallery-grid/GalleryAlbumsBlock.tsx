'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import type { GalleryGridBlockProps, GalleryImageItem } from './types'

export function GalleryAlbumsBlock({
    heading,
    intro,
    categories = [],
    items = [],
}: GalleryGridBlockProps) {
    const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null)
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
    const [mounted, setMounted] = useState(false)

    // Ensure portal only renders on the client side
    useEffect(() => {
        setMounted(true)
    }, [])

    // Lock page background scrolling when lightbox modal is active
    useEffect(() => {
        if (lightboxIndex !== null) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }
        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [lightboxIndex])

    const albumsMap = items.reduce((acc, item) => {
        const albumSlug = item.category || 'uncategorized'
        if (!acc[albumSlug]) acc[albumSlug] = []
        acc[albumSlug].push(item)
        return acc
    }, {} as Record<string, GalleryImageItem[]>)

    const activeAlbums = Object.keys(albumsMap).map((slug) => {
        const matchedCategory = categories.find((cat) => cat.slug === slug)
        const fallbackName = slug.charAt(0).toUpperCase() + slug.slice(1).replace(/[-_]/g, ' ')
        return {
            slug,
            name: matchedCategory ? matchedCategory.label : fallbackName,
            photos: albumsMap[slug] || [],
        }
    }).filter((album) => album.photos && album.photos.length > 0)

    const currentAlbumPhotos = selectedAlbum ? (albumsMap[selectedAlbum] || []) : []
    const currentAlbumData = activeAlbums.find(a => a.slug === selectedAlbum)

    return (
        <section className="relative w-full overflow-hidden bg-[var(--color-surface-faint)] pt-10 pb-16 md:pt-20 md:pb-24 px-4 sm:px-6 lg:px-8">
            <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
                <div className="absolute top-[5%] left-[5%] h-80 w-80 rounded-full bg-teal-300/25 opacity-70 mix-blend-multiply filter blur-[80px]" />
                <div className="absolute bottom-[10%] left-[20%] h-[500px] w-[500px] rounded-full bg-amber-200/35 opacity-60 mix-blend-multiply filter blur-[120px]" />
            </div>

            <div className="relative z-10 mx-auto max-w-6xl">
                {/* Header Section */}
                <div className="mb-16 text-center max-w-3xl mx-auto">
                    
                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 mb-3">
                        {heading || "Photo Albums"}
                    </h2>
                    {intro && <p className="text-sm text-gray-500 leading-relaxed max-w-2xl mx-auto">{intro}</p>}
                </div>

                {/* 🛠️ UPGRADED: AnimatePresence with 'wait' mode stops layout jumping between grid views */}
                <AnimatePresence mode="wait">
                    {!selectedAlbum ? (
                        /* ── VIEW PHASE 1: DIRECTORY ALBUM GRID ── */
                        <motion.div 
                            key="albums-directory"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            transition={{ duration: 0.35, ease: "easeInOut" }}
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-20 gap-x-12 pt-8"
                        >
                            {activeAlbums.map((album) => (
                                <div key={album.slug} onClick={() => setSelectedAlbum(album.slug)} className="group cursor-pointer flex flex-col items-center w-full">
                                    <div className="relative w-full aspect-[4/3] max-w-[320px]">
                                        {album.photos[2] && (
                                            <div className="absolute inset-0 rounded-2xl overflow-hidden bg-neutral-200 border-2 border-white shadow-md transform -translate-y-4 translate-x-4 rotate-[6deg] scale-[0.95] opacity-90 transition-transform duration-500 group-hover:-translate-y-6 group-hover:translate-x-6 group-hover:rotate-[10deg]">
                                                <Image src={album.photos[2].imageUrl} alt="" fill sizes="300px" className="object-cover brightness-90" />
                                            </div>
                                        )}
                                        {album.photos[1] && (
                                            <div className="absolute inset-0 rounded-2xl overflow-hidden bg-neutral-100 border-2 border-white shadow-lg transform -translate-y-2 -translate-x-2 rotate-[-4deg] scale-[0.98] opacity-95 transition-transform duration-500 group-hover:-translate-y-4 group-hover:-translate-x-4 group-hover:rotate-[-8deg]">
                                                <Image src={album.photos[1].imageUrl} alt="" fill sizes="300px" className="object-cover brightness-95" />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 rounded-2xl overflow-hidden border border-neutral-200/60 shadow-2xl bg-white transform transition-transform duration-500 group-hover:scale-[1.01] z-10">
                                            <Image src={album.photos[0]?.imageUrl || ''} alt={album.name} fill sizes="(max-width: 768px) 100vw, 400px" className="object-cover" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent flex flex-col justify-end p-5 select-none">
                                                <h3 className="text-base font-extrabold text-white tracking-tight leading-tight group-hover:text-sky-300">{album.name}</h3>
                                            </div>
                                            <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md text-white font-bold text-[9px] tracking-wider px-2.5 py-0.5 rounded-full select-none">
                                                {album.photos.length} {album.photos.length === 1 ? 'PHOTO' : 'PHOTOS'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    ) : (
                        /* ── VIEW PHASE 2: INTERNAL ALBUM GRID ── */
                        <motion.div 
                            key="photos-grid"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            transition={{ duration: 0.35, ease: "easeInOut" }}
                        >
                            <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-4">
                                <button onClick={() => setSelectedAlbum(null)} className="inline-flex items-center self-start text-xs font-bold text-gray-500 hover:text-sky-600 uppercase tracking-wider transition-colors cursor-pointer">
                                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                                    Back to Archives
                                </button>
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                                    Viewing Folder: <span className="text-gray-900 font-extrabold">{currentAlbumData?.name || 'General Collection'}</span>
                                </h3>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                {currentAlbumPhotos.map((photo, index) => (
                                    <div key={index} onClick={() => setLightboxIndex(index)} className="relative aspect-square rounded-xl overflow-hidden bg-neutral-100 group cursor-zoom-in border border-neutral-100 shadow-sm">
                                        <Image src={photo.imageUrl} alt={photo.caption || ''} fill sizes="(max-width: 640px) 50vw, 300px" className="object-cover group-hover:scale-102 transition-transform duration-300" />
                                        {photo.caption && (
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-3 flex items-end">
                                                <p className="text-white font-medium text-[11px] line-clamp-2 leading-snug">{photo.caption}</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── VIEW PHASE 3: PORTAL OVERLAY CANOPY ── */}
                {mounted && createPortal(
                    <AnimatePresence>
                        {lightboxIndex !== null && currentAlbumPhotos[lightboxIndex] && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 select-none"
                                style={{ zIndex: 999999 }}
                            >
                                {/* Fixed screen position Close Button */}
                                <button
                                    onClick={() => setLightboxIndex(null)}
                                    className="absolute top-6 right-6 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-3 rounded-full transition-all cursor-pointer z-[1000000]"
                                    aria-label="Close Lightbox"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>

                                {/* Center Carousel Viewer Viewport */}
                                <div className="relative w-full max-w-5xl h-[75vh] flex items-center justify-center z-[999999]">
                                    <Image
                                        src={currentAlbumPhotos[lightboxIndex].imageUrl}
                                        alt="Expanded Modal Gallery View"
                                        fill
                                        className="object-contain"
                                        priority
                                    />

                                    {/* Navigation Left Arrow */}
                                    <button
                                        type="button"
                                        onClick={() => setLightboxIndex((prev) => (prev! - 1 + currentAlbumPhotos.length) % currentAlbumPhotos.length)}
                                        className="absolute left-4 text-white bg-white/10 hover:bg-white/20 p-3 rounded-full transition-all cursor-pointer z-[1000000]"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                                    </button>

                                    {/* Navigation Right Arrow */}
                                    <button
                                        type="button"
                                        onClick={() => setLightboxIndex((prev) => (prev! + 1) % currentAlbumPhotos.length)}
                                        className="absolute right-4 text-white bg-white/10 hover:bg-white/20 p-3 rounded-full transition-all cursor-pointer z-[1000000]"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                                    </button>
                                </div>

                                {/* Bottom Metadata info footer overlay */}
                                <div className="mt-6 text-center max-w-2xl px-4 z-[999999]">
                                    <p className="text-white font-semibold text-sm tracking-wide">
                                        {currentAlbumPhotos[lightboxIndex].caption || ""}
                                    </p>
                                    <p className="text-neutral-400 text-xs mt-1.5 font-bold tracking-widest uppercase">
                                        {lightboxIndex + 1} / {currentAlbumPhotos.length}
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>,
                    document.body
                )}
            </div>
        </section>
    )
}