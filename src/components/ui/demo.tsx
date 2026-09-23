"use client";

import { SqueezeCarousel, type SqueezeSlide } from "@/components/ui/carousel-squeeze";

export const settings = {
    height: 320,
    gap: 16,
    slatGap: 8,
    slatWidth: 8,
    radius: 6,
    duration: 1000,
    hoverGrow: true,
    autoplay: false,
    interval: 6000,
    controls: true,
};

type DemoProps = Partial<typeof settings>;

/** A wordmark for the corner of the open panel. */
const mark = (text: string) => (
    <span className="text-sm font-medium tracking-tight text-white">{text}</span>
);

const slides: SqueezeSlide[] = [
    {
        id: "haircut",
        title: "The Signature Fade & Scissor Cut",
        description:
            "Architectural precision taper, skin fades, and scissor sculpting customized to your head profile and personal style.",
        action: "Book Service",
        overlay: mark("Master Barber Suite"),
        image: "/src/assets/images/service_precision_haircut_1790150247157.jpg",
        imageAlt: "Master barber sculpting a clean classic taper fade at Dappers",
    },
    {
        id: "shave",
        title: "Royal Hot Towel Straight-Razor Shave",
        description:
            "Double hot towel steam infusion, rich sandalwood lather, single-edge straight razor line-up, and cooling soothing balm.",
        action: "Reserve Shave",
        overlay: mark("Royal Ritual"),
        image: "/src/assets/images/service_beard_sculpt_1790150259291.jpg",
        imageAlt: "Gentleman receiving hot towel treatment and straight-razor shave",
    },
    {
        id: "facial",
        title: "Deep Charcoal Detox Facial & Skin Rejuvenation",
        description:
            "Steam pore extraction, activated charcoal mask, cold compress, and high-frequency skin toning designed for Karachi's climate.",
        action: "Book Facial",
        overlay: mark("Detox Therapy"),
        image: "/src/assets/images/service_gentleman_facial_1790150283552.jpg",
        imageAlt: "Gentleman undergoing charcoal detox skincare therapy",
    },
    {
        id: "lounge",
        title: "The Gentleman's Private Lounge & VIP Stations",
        description:
            "Unwind in plush hydraulic barber chairs, ambient acoustic soundscapes, espresso hospitality, and late-night grooming until 1:00 AM.",
        action: "Explore Salon",
        overlay: mark("Lounge Experience"),
        image: "/src/assets/images/salon_interior_luxury_1790150271262.jpg",
        imageAlt: "Dappers luxury barber salon interior in Gulzar-e-Hijri",
    },
    {
        id: "revival",
        title: "The Executive Revival Grooming Combo",
        description:
            "Complete transformation: Signature Haircut, Razor Beard Sculpt, Charcoal Detox Facial, and Acupressure Scalp Therapy.",
        action: "Book Package",
        overlay: mark("Executive Royale"),
        image: "/src/assets/images/hero_gentleman_lounge_1790150232790.jpg",
        imageAlt: "The executive suite grooming setup at Dappers",
    },
];

export default function SqueezeCarouselDemo(props: DemoProps) {
    const options = { ...settings, ...props };

    return (
        <div className="bg-background w-full px-6 py-10">
            <SqueezeCarousel slides={slides} label="Featured Grooming Experiences" {...options} />
        </div>
    );
}
