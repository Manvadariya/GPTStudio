import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Brain, Buildings, Envelope, Lock, User, Sparkle } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { apiService } from '../../lib/apiService'; // Ensure this path is correct
import { useNavigate } from 'react-router-dom';

export function AuthScreen({ onAuth }) {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [loginForm, setLoginForm] = useState({ email: '', password: '' });
    const [signupForm, setSignupForm] = useState({ name: '', email: '', password: '', company: '' });

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!loginForm.email || !loginForm.password) {
            toast.error("Please fill in all fields.");
            return;
        }
        setIsLoading(true);
        try {
            const response = await apiService.login(loginForm);
            localStorage.setItem('authToken', response.token);
            toast.success('Welcome back!');
            console.log('Navigating to dashboard...');

            navigate('/app');
        } catch (error) {
            toast.error(error.message || "Login failed. Please check your credentials.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        if (!signupForm.name || !signupForm.email || !signupForm.password || !signupForm.company) {
            toast.error("Please fill in all fields.");
            return;
        }
        setIsLoading(true);
        try {
            const response = await apiService.signup(signupForm);
            localStorage.setItem('authToken', response.token);
            toast.success('Account created successfully!');
            console.log('Navigating to dashboard... signup');
            navigate('/app/projects'); // Navigate to the projects page after signup
        } catch (error) {
            toast.error(error.message || "Signup failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#eff5fb] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Dynamic Background Elements similar to Landing Page */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div
                    className="absolute inset-0 [perspective:200px]"
                    style={{ '--grid-angle': '65deg', '--cell-size': '50px', '--opacity': '0.2', '--light-line': 'rgba(11,19,30,0.05)' }}
                >
                    <div className="absolute inset-0 [transform:rotateX(var(--grid-angle))]">
                        <div className="animate-grid [background-image:linear-gradient(to_right,var(--light-line)_1px,transparent_0),linear-gradient(to_bottom,var(--light-line)_1px,transparent_0)] [background-repeat:repeat] [background-size:var(--cell-size)_var(--cell-size)] [height:300vh] [inset:0%_0px] [margin-left:-200%] [transform-origin:100%_0_0] [width:600vw] opacity-20"></div>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-[#eff5fb] to-transparent"></div>
                </div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="w-full max-w-md relative z-10"
            >
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-extrabold tracking-tighter text-[#0b131e]">
                        GPTStudio
                    </h1>
                    <p className="text-[#0b131e]/60 mt-2 font-medium">Build and deploy custom AI assistants</p>
                </div>

                <Card className="bg-white border-[#0b131e]/10 shadow-xl rounded-2xl overflow-hidden">
                    <Tabs defaultValue="login" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 p-1 bg-[#eff5fb]/50 border-b border-[#0b131e]/5 rounded-none h-14">
                            <TabsTrigger
                                value="login"
                                className="rounded-none data-[state=active]:bg-white data-[state=active]:text-[#2d74d7] data-[state=active]:shadow-none font-semibold transition-all"
                            >
                                Sign In
                            </TabsTrigger>
                            <TabsTrigger
                                value="signup"
                                className="rounded-none data-[state=active]:bg-white data-[state=active]:text-[#2d74d7] data-[state=active]:shadow-none font-semibold transition-all"
                            >
                                Sign Up
                            </TabsTrigger>
                        </TabsList>

                        <div className="p-6">
                            <TabsContent value="login" className="mt-0">
                                <form onSubmit={handleLogin} className="space-y-6">
                                    <div className="space-y-1">
                                        <CardTitle className="text-2xl font-bold text-[#0b131e]">Welcome back</CardTitle>
                                        <CardDescription className="text-[#0b131e]/60 font-medium">Sign in to your account to continue</CardDescription>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="login-email" className="text-[#0b131e]/70 font-semibold text-sm">Email Address</Label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 flex items-center justify-center w-10">
                                                    <Envelope size={18} className="text-[#0b131e]/40" />
                                                </div>
                                                <Input
                                                    id="login-email"
                                                    type="email"
                                                    placeholder="you@company.com"
                                                    className="pl-10 h-12 bg-[#eff5fb]/30 border-[#0b131e]/10 focus:border-[#2d74d7] focus:ring-[#2d74d7]/20 rounded-xl"
                                                    value={loginForm.email}
                                                    onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="login-password" className="text-[#0b131e]/70 font-semibold text-sm">Password</Label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 flex items-center justify-center w-10">
                                                    <Lock size={18} className="text-[#0b131e]/40" />
                                                </div>
                                                <Input
                                                    id="login-password"
                                                    type="password"
                                                    placeholder="••••••••"
                                                    className="pl-10 h-12 bg-[#eff5fb]/30 border-[#0b131e]/10 focus:border-[#2d74d7] focus:ring-[#2d74d7]/20 rounded-xl"
                                                    value={loginForm.password}
                                                    onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <Button type="submit" className="w-full h-12 bg-[#2d74d7] hover:bg-[#2d74d7]/90 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98]" disabled={isLoading}>
                                        {isLoading ? (
                                            <div className="flex items-center justify-center">
                                                <motion.div
                                                    animate={{ rotate: 360 }}
                                                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                                                />
                                            </div>
                                        ) : (
                                            'Sign In'
                                        )}
                                    </Button>
                                </form>
                            </TabsContent>

                            <TabsContent value="signup" className="mt-0">
                                <form onSubmit={handleSignup} className="space-y-6">
                                    <div className="space-y-1">
                                        <CardTitle className="text-2xl font-bold text-[#0b131e]">Create account</CardTitle>
                                        <CardDescription className="text-[#0b131e]/60 font-medium">Get started with your AI platform today</CardDescription>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="signup-name" className="text-[#0b131e]/70 font-semibold text-sm">Full Name</Label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 flex items-center justify-center w-10">
                                                    <User size={18} className="text-[#0b131e]/40" />
                                                </div>
                                                <Input
                                                    id="signup-name"
                                                    placeholder="John Doe"
                                                    className="pl-10 h-12 bg-[#eff5fb]/30 border-[#0b131e]/10 focus:border-[#2d74d7] focus:ring-[#2d74d7]/20 rounded-xl w-full"
                                                    value={signupForm.name}
                                                    onChange={(e) => setSignupForm(prev => ({ ...prev, name: e.target.value }))}
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="signup-company" className="text-[#0b131e]/70 font-semibold text-sm">Company</Label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 flex items-center justify-center w-10">
                                                    <Buildings size={18} className="text-[#0b131e]/40" />
                                                </div>
                                                <Input
                                                    id="signup-company"
                                                    placeholder="Your Company"
                                                    className="pl-10 h-12 bg-[#eff5fb]/30 border-[#0b131e]/10 focus:border-[#2d74d7] focus:ring-[#2d74d7]/20 rounded-xl"
                                                    value={signupForm.company}
                                                    onChange={(e) => setSignupForm(prev => ({ ...prev, company: e.target.value }))}
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="signup-email" className="text-[#0b131e]/70 font-semibold text-sm">Email Address</Label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 flex items-center justify-center w-10">
                                                    <Envelope size={18} className="text-[#0b131e]/40" />
                                                </div>
                                                <Input
                                                    id="signup-email"
                                                    type="email"
                                                    placeholder="you@company.com"
                                                    className="pl-10 h-12 bg-[#eff5fb]/30 border-[#0b131e]/10 focus:border-[#2d74d7] focus:ring-[#2d74d7]/20 rounded-xl"
                                                    value={signupForm.email}
                                                    onChange={(e) => setSignupForm(prev => ({ ...prev, email: e.target.value }))}
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="signup-password" className="text-[#0b131e]/70 font-semibold text-sm">Password</Label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 flex items-center justify-center w-10">
                                                    <Lock size={18} className="text-[#0b131e]/40" />
                                                </div>
                                                <Input
                                                    id="signup-password"
                                                    type="password"
                                                    placeholder="Create a strong password"
                                                    className="pl-10 h-12 bg-[#eff5fb]/30 border-[#0b131e]/10 focus:border-[#2d74d7] focus:ring-[#2d74d7]/20 rounded-xl"
                                                    value={signupForm.password}
                                                    onChange={(e) => setSignupForm(prev => ({ ...prev, password: e.target.value }))}
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <Button type="submit" className="w-full h-12 bg-[#2d74d7] hover:bg-[#2d74d7]/90 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98]" disabled={isLoading}>
                                        {isLoading ? (
                                            <div className="flex items-center justify-center">
                                                <motion.div
                                                    animate={{ rotate: 360 }}
                                                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                                                />
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <Sparkle size={20} weight="duotone" />
                                                Create Account
                                            </div>
                                        )}
                                    </Button>
                                </form>
                            </TabsContent>
                        </div>
                    </Tabs>
                </Card>

                <p className="text-center text-sm text-[#0b131e]/40 mt-8 font-medium">
                    By signing up, you agree to our <a href="#" className="underline">Terms</a> and <a href="#" className="underline">Privacy Policy</a>
                </p>
            </motion.div>
        </div>
    );
}
