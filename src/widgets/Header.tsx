import Link from "next/link";

export default function Header() {
    return (
        <header className="flex px-6 py-4 justify-between items-center">
            <Link href="/">
                <h1 className="text-2xl font-bold">Tech Blog</h1>
            </Link>
        </header>
    )
}