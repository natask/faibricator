import React, { useEffect, useRef, useCallback, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../src/components/components/ui/card';
import { Button } from '../src/components/components/ui/button';
import { Input } from '../src/components/components/ui/input';
import { Label } from '../src/components/components/ui/label';
import { Zap, AlertCircle } from 'lucide-react';

interface LoginPageProps {
  onLogin: () => void;
}

// To prevent TypeScript errors since the 'google' object is from a script
declare const google: any;

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);

    const googleButtonRef = useRef<HTMLDivElement>(null);
    const isGoogleReady = typeof google !== 'undefined' && google.accounts;
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '983563663483-akvu3hmiv0rj7r3b8okoscdui4ftojoo.apps.googleusercontent.com';

    const handleCredentialResponse = useCallback((response: any) => {
        console.log("Google Auth successful. Credential:", response.credential);
        onLogin();
    }, [onLogin]);

    const handleNativeLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) {
            setError('Please enter both email and password.');
            return;
        }
        setError('');
        console.log('Native login successful for:', email);
        onLogin();
    };

    // Check for Google script loading
    useEffect(() => {
        const checkGoogleLoaded = () => {
            if (typeof google !== 'undefined' && google.accounts) {
                setIsGoogleLoaded(true);
            } else {
                // Check again after a short delay
                setTimeout(checkGoogleLoaded, 100);
            }
        };
        
        checkGoogleLoaded();
    }, []);


    useEffect(() => {
        if (!isGoogleLoaded || !isGoogleReady || !clientId) {
            return;
        }

        try {
            google.accounts.id.initialize({
                client_id: clientId,
                callback: handleCredentialResponse,
            });

            if (googleButtonRef.current) {
                // Clear any existing button first
                googleButtonRef.current.innerHTML = '';
                google.accounts.id.renderButton(
                    googleButtonRef.current,
                    { theme: "outline", size: "large", type: 'standard', text: 'signin_with', shape: 'pill' }
                );
            }
        } catch (error) {
            console.error("Error initializing Google Sign-In:", error);
        }

        return () => {
            if (isGoogleReady) {
                google.accounts.id.disableAutoSelect();
            }
        };
    }, [handleCredentialResponse, isGoogleLoaded, isGoogleReady, clientId]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <Card className="w-full max-w-md border-border/40">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="w-12 h-12 bg-foreground rounded-xl flex items-center justify-center">
                            <Zap className="w-7 h-7 text-background" />
                        </div>
                    </div>
                    <CardTitle className="text-3xl font-bold text-foreground">
                        Fabricator
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                        From concept to creation. Sign in to continue.
                    </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-6">
                    <form onSubmit={handleNativeLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                required
                            />
                        </div>
                        {error && (
                            <div className="flex items-center space-x-2 text-sm text-destructive">
                                <AlertCircle className="w-4 h-4" />
                                <span>{error}</span>
                            </div>
                        )}
                        <Button type="submit" className="w-full bg-foreground text-background hover:bg-foreground/90">
                            Sign In
                        </Button>
                    </form>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                        </div>
                    </div>

                    <div className="flex justify-center">
                        {!clientId ? (
                            <div className="p-4 rounded-md bg-destructive/10 text-destructive border border-destructive/20">
                                <p className="font-semibold text-sm">Google Sign-In Not Configured</p>
                            </div>
                        ) : !isGoogleLoaded ? (
                            <div className="p-4 rounded-md bg-muted/10 text-muted-foreground border border-muted/20">
                                <p className="font-semibold text-sm">Loading Google Sign-In...</p>
                            </div>
                        ) : (
                            <div ref={googleButtonRef}></div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default LoginPage;