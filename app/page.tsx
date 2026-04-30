import Link from 'next/link'

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center font-sans gap-4">
      <p>hello</p>
      <Link
        href="/editor"
        className="rounded px-4 py-2 text-sm text-white"
        style={{ background: '#7c6df0' }}
      >
        Open Editor
      </Link>
    </div>
  );
}