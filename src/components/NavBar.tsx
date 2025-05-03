"use client"

import { AuthService } from "@/service";
import Link from "next/link";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { LogOut, Menu, X } from "lucide-react";

const Navbar = () => {
    const authService = AuthService.getInstance();
    const [user, setUser] = useState<any>(null);
    const [menuOpen, setMenuOpen] = useState(false);

    const fetchUser = async () => {
        try {
            const user = await authService.getAccount();
            setUser(user || null);
        } catch (err: any) {
            setUser(null);
        }
    }

    useEffect(() => {
        fetchUser();
    }, []);

    const handleLogout = () => {
        authService.logout()
            .then(() => {
                setUser(null);
                toast.success("Logout sucess!");
                setMenuOpen(false);
            })
            .catch((err: any) => {
                toast.error(err.message);
            });
    };

    return (
        <nav className="w-full bg-gradient-to-r from-gray-900 via-black to-gray-900 shadow-lg">
            <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                <Link href="/" className="text-2xl font-bold text-white hover:text-blue-400 transition">
                    Bravo Corporation
                </Link>

                {/* Hamburger Icon */}
                <button
                    className="md:hidden text-white"
                    onClick={() => setMenuOpen(!menuOpen)}
                    aria-label="Abrir menu"
                >
                    {menuOpen ? <X size={28} /> : <Menu size={28} />}
                </button>

                {/* Menu Desktop */}
                <ul className="hidden md:flex items-center space-x-6">
                    {user ? (
                        <>
                            <li>
                                <p className="text-white">
                                    Bem-vindo, <span className="font-semibold text-blue-400">{user.name}</span>
                                </p>
                            </li>
                            <li></li>
                            <li>
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-2 text-slate-300 hover:text-red-400 transition"
                                >
                                    <LogOut size={18} />
                                    Logout
                                </button>
                            </li>
                        </>
                    ) : (
                        <>
                            <li>
                                <Link href="/" className="text-slate-300 hover:text-white transition">
                                    Home
                                </Link>
                            </li>
                            <li>
                                <Link href="/login" className="text-slate-300 hover:text-white transition">
                                    Login
                                </Link>
                            </li>
                            <li>
                                <Link href="/cadastro" className="text-slate-300 hover:text-white transition">
                                    Sign-in
                                </Link>
                            </li>
                        </>
                    )}
                </ul>
            </div>

            {/* Menu Mobile */}
            {menuOpen && (
                <ul className="md:hidden flex flex-col items-center bg-gray-900 py-4 space-y-4">
                    {user ? (
                        <>
                            <li>
                                <p className="text-white">
                                    Bem-vindo, <span className="font-semibold text-blue-400">{user.name}</span>
                                </p>
                            </li>
                            <li>
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-2 text-slate-300 hover:text-red-400 transition"
                                >
                                    <LogOut size={18} />
                                    Logout
                                </button>
                            </li>
                        </>
                    ) : (
                        <>
                            <li>
                                <Link href="/" className="text-slate-300 hover:text-white transition" onClick={() => setMenuOpen(false)}>
                                    Home
                                </Link>
                            </li>
                            <li>
                                <Link href="/login" className="text-slate-300 hover:text-white transition" onClick={() => setMenuOpen(false)}>
                                    Login
                                </Link>
                            </li>
                            <li>
                                <Link href="/cadastro" className="text-slate-300 hover:text-white transition" onClick={() => setMenuOpen(false)}>
                                    Sign-in
                                </Link>
                            </li>
                        </>
                    )}
                </ul>
            )}
        </nav>
    );
};

export default Navbar;