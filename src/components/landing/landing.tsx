import { LandingHero } from "@/components/landing/landing-hero";
import { LandingPlay } from "@/components/landing/landing-play";

function Landing({ signedIn }: { signedIn: boolean }) {
  return (
    <div data-slot="landing">
      <LandingHero signedIn={signedIn} />
      <LandingPlay />
    </div>
  );
}

export { Landing };
