"use client"

import { AuthService } from "@/service";
import Link from "next/link";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { LogOut, Menu, X, ChevronDown, User, LayoutDashboard, Users, FileText } from "lucide-react";

const Navbar = () => {
    const authService = AuthService.getInstance();
    const [user, setUser] = useState<any>(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const user = await authService.getAccount();
                setUser(user || null);
            } catch {
                setUser(null);
            }
        };
        fetchUser();
    }, []);

    const handleLogout = () => {
        authService.logout()
            .then(() => {
                setUser(null);
                toast.success("Logout realizado com sucesso!");
                setMenuOpen(false);
            })
            .catch((err: any) => {
                toast.error(err.message);
            });
    };

    return (
        <nav className="w-full bg-gray-900/90 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div className="flex-shrink-0 flex items-center">
                        <Link href="/" className="flex items-center gap-2">
                  
                                <img
                                    src="https://media.licdn.com/dms/image/v2/D4D0BAQFpcmgTMiaTrQ/company-logo_200_200/B4DZT6pFClHYAQ-/0/1739371860558/bravocorp_logo?e=2147483647&v=beta&t=2h4zWICN3TQHGdM99McX7sdn7Y9k59FNH5B6jizSmBM"
                                    alt="Bravo Corp Logo"
                                    className="object-contain w-12 h-12 rounded-lg"
                                />
                                <span className="text-xl font-bold text-white ml-2 hidden sm:block">Bravo Corp</span>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:block">
                        <div className="ml-10 flex items-center space-x-8">
                            <Link href="/" className="text-gray-300 hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1 transition-colors">
                                <LayoutDashboard size={16} className="text-blue-400" />
                                Dashboard
                            </Link>
                            <Link href="/registros" className="text-gray-300 hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1 transition-colors">
                                <FileText size={16} className="text-blue-400" />
                                Registros
                            </Link>
                            {user && (
                                <Link href="/membros" className="text-gray-300 hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1 transition-colors">
                                    <Users size={16} className="text-blue-400" />
                                    Membros
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Right Section */}
                    <div className="hidden md:block">
                        <div className="ml-4 flex items-center md:ml-6">
                            {user ? (
                                <div className="relative ml-3">
                                    <div className="flex items-center space-x-4">
                                        <button
                                            onClick={() => setDropdownOpen(!dropdownOpen)}
                                            className="flex items-center text-sm rounded-full focus:outline-none"
                                            id="user-menu"
                                            aria-expanded="false"
                                            aria-haspopup="true"
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-600 to-blue-400 flex items-center justify-center text-white font-medium shadow">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="text-gray-200 font-medium">{user.name}</span>
                                                <ChevronDown size={16} className={`text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                                            </div>
                                        </button>
                                    </div>

                                    {dropdownOpen && (
                                        <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-gray-800 ring-1 ring-gray-700 focus:outline-none z-50">
                                            <div className="px-4 py-3 border-b border-gray-700">
                                                <p className="text-sm text-white font-medium">{user.name}</p>
                                                <p className="text-xs text-gray-400 truncate">{user.email}</p>
                                            </div>
                                            <Link
                                                href="/perfil"
                                                className=" px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white flex items-center gap-2"
                                                onClick={() => setDropdownOpen(false)}
                                            >
                                                <User size={14} className="text-blue-400" />
                                                Meu Perfil
                                            </Link>
                                            <button
                                                onClick={handleLogout}
                                                className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white flex items-center gap-2"
                                            >
                                                <LogOut size={14} className="text-red-400" />
                                                Sair
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex items-center gap-4">
                                    <Link
                                        href="/login"
                                        className="px-4 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-white transition-colors"
                                    >
                                        Entrar
                                    </Link>
                                    <Link
                                        href="/cadastro"
                                        className="px-4 py-2 rounded-md text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-lg transition-all"
                                    >
                                        Cadastrar
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Mobile menu button */}
                    <div className="-mr-2 flex md:hidden">
                        <button
                            onClick={() => setMenuOpen(!menuOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 focus:outline-none transition"
                            aria-expanded="false"
                        >
                            <span className="sr-only">Abrir menu</span>
                            {menuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            {menuOpen && (
                <div className="md:hidden bg-gray-800 border-t border-gray-700 shadow-xl">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        <Link
                            href="/"
                            className=" px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700 flex items-center gap-2"
                            onClick={() => setMenuOpen(false)}
                        >
                            <LayoutDashboard size={16} className="text-blue-400" />
                            Dashboard
                        </Link>
                        <Link
                            href="/registros"
                            className=" px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700 flex items-center gap-2"
                            onClick={() => setMenuOpen(false)}
                        >
                            <FileText size={16} className="text-blue-400" />
                            Registros
                        </Link>
                        {user && (
                            <Link
                                href="/membros"
                                className=" px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700 flex items-center gap-2"
                                onClick={() => setMenuOpen(false)}
                            >
                                <Users size={16} className="text-blue-400" />
                                Membros
                            </Link>
                        )}
                    </div>
                    <div className="pt-4 pb-3 border-t border-gray-700">
                        {user ? (
                            <>
                                <div className="flex items-center px-5">
                                    <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-600 to-blue-400 flex items-center justify-center text-white font-medium shadow">
                                        {user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="ml-3">
                                        <div className="text-base font-medium text-white">{user.name}</div>
                                        <div className="text-sm font-medium text-gray-400">{user.email}</div>
                                    </div>
                                </div>
                                <div className="mt-3 px-2 space-y-1">
                                    <Link
                                        href={user ? `/membros/${user.$id}` : "#"}
                                        className=" px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700 flex items-center gap-2"
                                        onClick={() => setMenuOpen(false)}
                                    >
                                        <User size={16} className="text-blue-400" />
                                        Meu Perfil
                                    </Link>
                                    <button
                                        onClick={() => { handleLogout(); setMenuOpen(false); }}
                                        className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700 flex items-center gap-2"
                                    >
                                        <LogOut size={16} className="text-red-400" />
                                        Sair
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="px-5 py-3 space-y-3">
                                <Link
                                    href="/login"
                                    className="w-full block text-center px-4 py-2 rounded-md text-base font-medium text-blue-400 hover:bg-gray-700 hover:text-white"
                                    onClick={() => setMenuOpen(false)}
                                >
                                    Entrar
                                </Link>
                                <Link
                                    href="/cadastro"
                                    className="w-full block text-center px-4 py-2 rounded-md text-base font-medium text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-lg"
                                    onClick={() => setMenuOpen(false)}
                                >
                                    Cadastrar
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;