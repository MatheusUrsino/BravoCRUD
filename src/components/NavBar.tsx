"use client"

import { AuthService } from "@/service";
import Link from "next/link";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { LogOut } from "lucide-react";

const Navbar = () => {
    const authService = AuthService.getInstance();
    const [user, setUser] = useState<any>(null);

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

    return (
        <nav className="w-full bg-gradient-to-r from-gray-900 via-black to-gray-900 shadow-lg">
            <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                <Link href="/" className="text-2xl font-bold text-white hover:text-blue-400 transition">
                    Bravo Corporation
                </Link>

                <ul className="flex items-center space-x-6">
                    {user ? (
                        <>
                            <li>
                                <p className="text-white">
                                    Bem-vindo, <span className="font-semibold text-blue-400">{user.name}</span>
                                </p>
                            </li>
                            <li>
                            
                            </li>
                            <li>
                                <button onClick={() =>
                                    authService.logout()
                                        .then(() => {
                                            setUser(null);
                                            toast.success("Logout sucess!");
                                        })
                                        .catch((err: any) => {
                                            toast.error(err.message);
                                        })
                                }
                                    className="flex items-center gap-2 text-slate-300 hover:text-red-400 transition">
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
        </nav>
    );
};

export default Navbar;
