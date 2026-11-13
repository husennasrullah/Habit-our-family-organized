import Image from "next/image";
export function EmptyIllustration({
  name,
}: {
  name: "calendar" | "album" | "documents" | "travel";
}) {
  return (
    <Image
      src={`/illustrations/${name}.webp`}
      alt=""
      width={140}
      height={140}
      className="mx-auto h-28 w-28 object-contain"
    />
  );
}
