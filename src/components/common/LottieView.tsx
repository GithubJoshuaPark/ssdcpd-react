import Lottie from "lottie-react";
import type { FC } from "react";
import { useEffect, useState } from "react";

interface LottieViewProps {
  fileName: string;
  className?: string;
  loop?: boolean;
  autoplay?: boolean;
}

export const LottieView: FC<LottieViewProps> = ({
  fileName,
  className,
  loop = true,
  autoplay = true,
}) => {
  const [animationData, setAnimationData] = useState<unknown>(null);

  useEffect(() => {
    // Dynamic import for the lottie file
    // Note: Since these are in public, we can just fetch them or import if they were in src
    // But since they are in public/images/lottiefiles, it's easier to fetch them
    fetch(`/images/lottiefiles/${fileName}`)
      .then(res => res.json())
      .then(data => setAnimationData(data))
      .catch(err => console.error("Error loading lottie file:", err));
  }, [fileName]);

  if (!animationData)
    return <div className={className} style={{ minHeight: "300px" }} />;

  return (
    <div className={className}>
      <Lottie animationData={animationData} loop={loop} autoplay={autoplay} />
    </div>
  );
};
