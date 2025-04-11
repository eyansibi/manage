import { useState, useRef, useEffect } from "react";
import api from "../utils/Api";
import { useNavigate } from "react-router-dom";
import { toast } from 'react-hot-toast';

const ForgetPassword = () => {
    const [step, setStep] = useState(1); // Étape 1: Demande, 2: Vérification, 3: Réinitialisation
    const [email, setEmail] = useState("");
    const [codeDigits, setCodeDigits] = useState(['', '', '', '', '', '']); // Array for 6 digit code
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [resendLoading, setResendLoading] = useState(false);
    const navigate = useNavigate();
    
    // Create refs for each input field
    const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null)];
    
    // Start countdown timer for resend code button
    useEffect(() => {
        if (countdown <= 0) return;
        
        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) clearInterval(timer);
                return prev - 1;
            });
        }, 1000);
        
        return () => clearInterval(timer);
    }, [countdown]);
    
    // Étape 1: Envoi du code de réinitialisation
    const handleRequestReset = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const response = await api.post("/api/auth/forgotPassword", { email });
            setMessage({ type: "success", text: response.data.message });
            setStep(2); // Passe à l'étape de vérification
            setCountdown(60); // Start a 60-second countdown for resend
        } catch (error) {
            setMessage({ type: "error", text: error.response?.data?.error || "Erreur lors de la demande." });
        } finally {
            setLoading(false);
        }
    };

    // Handle input changes and auto-focus to next input
    const handleCodeChange = (index, value) => {
        // Allow only numbers
        if (!/^\d*$/.test(value)) return;
        
        // Create a new array with the updated digit
        const newCodeDigits = [...codeDigits];
        newCodeDigits[index] = value;
        setCodeDigits(newCodeDigits);
        
        // Auto-focus to next input if value is entered
        if (value !== '' && index < 5) {
            inputRefs[index + 1].current.focus();
        }
        
        // Auto-submit if all digits are filled
        if (value !== '' && index === 5 && newCodeDigits.every(digit => digit !== '')) {
            // Give a small delay before submitting to allow the UI to update
            setTimeout(() => {
                handleVerifyToken(new Event('submit'));
            }, 300);
        }
    };
    
    // Handle backspace key to go to previous input
    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && codeDigits[index] === '' && index > 0) {
            inputRefs[index - 1].current.focus();
        }
    };
    
    // Handle pasting verification code
    const handlePaste = (e) => {
        e.preventDefault();
        const pastedText = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
        
        if (pastedText.length === 0) return;
        
        const newCodeDigits = [...codeDigits];
        
        // Fill in as many digits as we have from the pasted text
        for (let i = 0; i < Math.min(pastedText.length, 6); i++) {
            newCodeDigits[i] = pastedText[i];
        }
        
        setCodeDigits(newCodeDigits);
        
        // Focus the appropriate input after pasting
        if (pastedText.length < 6) {
            inputRefs[pastedText.length].current.focus();
        } else {
            inputRefs[5].current.focus();
            // Auto-submit if all digits are filled
            setTimeout(() => {
                handleVerifyToken(new Event('submit'));
            }, 300);
        }
    };
    
    // Handle resending the verification code
    const handleResendCode = async () => {
        if (!email) {
            setMessage({ type: "error", text: "Email information missing. Please start over." });
            setStep(1);
            return;
        }
        
        setResendLoading(true);
        
        try {
            const response = await api.post("/api/auth/forgotPassword", { email });
            setMessage({ type: "success", text: response.data.message || "Code resent successfully!" });
            
            // Reset countdown
            setCountdown(60);
            
        } catch (error) {
            setMessage({ type: "error", text: error.response?.data?.error || "Failed to resend code" });
        } finally {
            setResendLoading(false);
        }
    };
    
    // Étape 2: Vérification du code
    const handleVerifyToken = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);
        
        // Combine the 6 digits into a single verification code
        const resetToken = codeDigits.join('');
        
        if (resetToken.length !== 6) {
            setMessage({ type: "error", text: "Veuillez entrer les 6 chiffres du code." });
            setLoading(false);
            return;
        }

        try {
            const response = await api.post("/api/auth/verifyResetToken", { resetToken });
            setMessage({ type: "success", text: response.data.message });
            setStep(3); // Passe à l'étape de réinitialisation
        } catch (error) {
            setMessage({ type: "error", text: error.response?.data?.error || "Code invalide ou expiré." });
            // Clear the inputs on error
            setCodeDigits(['', '', '', '', '', '']);
            // Focus the first input
            inputRefs[0].current.focus();
        } finally {
            setLoading(false);
        }
    };

    // Étape 3: Réinitialisation du mot de passe
    const handleResetPassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        if (newPassword !== confirmPassword) {
            setMessage({ type: "error", text: "Les mots de passe ne correspondent pas." });
            setLoading(false);
            return;
        }

        try {
            const resetToken = codeDigits.join('');
            const response = await api.put("/api/auth/resetPassword", { 
                email,
                resetToken, 
                newPassword  // Some APIs expect 'password' instead of 'newPassword'
            });
            setMessage({ type: "success", text: response.data.message });

            // Rediriger après succès
            setTimeout(() => {
                navigate("/login");
            }, 2000);
        } catch (error) {
            console.error(error);
            setMessage({ type: "error", text: error.response?.data?.error || "Erreur lors de la réinitialisation." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-base-200 font-poppins flex items-center justify-center">
            <div className="card flex-shrink-0 w-full max-w-md shadow-xl bg-base-100">
                <div className="card-body p-6 lg:p-8">
                    {message && (
                        <div className={`alert ${message.type === "success" ? "alert-success" : "alert-error"} mb-4`}>
                            {message.text}
                        </div>
                    )}

                    {step === 1 && (
                        <form onSubmit={handleRequestReset}>
                            <h2 className="text-2xl font-bold text-center mb-6 text-primary">Mot de passe oublié</h2>
                            <p className="text-center text-white mb-6">
                                Entrez votre email pour recevoir un code de réinitialisation.
                            </p>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text text-white font-medium">Email</span>
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="input input-bordered input-md w-full"
                                    placeholder="Entrez votre email"
                                />
                                <label className="label">
                                    <span className="label-text-alt text-gray-300">Nous enverrons un code à cette adresse email.</span>
                                </label>
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className={`btn btn-primary btn-md w-full mt-6 ${loading ? "loading" : ""}`}
                            >
                                {loading ? "Envoi en cours..." : "Envoyer le code"}
                            </button>
                        </form>
                    )}

                    {step === 2 && (
                        <form onSubmit={handleVerifyToken}>
                            <h2 className="text-2xl font-bold text-center mb-6 text-primary">Vérification du Code</h2>
                            <p className="text-center text-white mb-6">
                                Entrez le code que vous avez reçu par email.
                            </p>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text text-white font-medium">Code de réinitialisation</span>
                                </label>
                                
                                {/* PIN Code Input */}
                                <div className="flex justify-center space-x-2 mt-2">
                                    {codeDigits.map((digit, index) => (
                                        <div key={index}>
                                            <label htmlFor={`code-${index + 1}`} className="sr-only">Chiffre {index + 1}</label>
                                            <input
                                                type="text"
                                                maxLength="1"
                                                id={`code-${index + 1}`}
                                                ref={inputRefs[index]}
                                                className="block w-12 h-12 py-3 text-xl font-extrabold text-center text-primary bg-base-200 border border-base-300 rounded-lg focus:ring-primary focus:border-primary"
                                                value={digit}
                                                onChange={(e) => handleCodeChange(index, e.target.value)}
                                                onKeyDown={(e) => handleKeyDown(index, e)}
                                                onPaste={index === 0 ? handlePaste : null}
                                                required
                                            />
                                        </div>
                                    ))}
                                </div>
                                
                                <p className="mt-2 text-sm text-gray-300 text-center">
                                    Veuillez entrer le code à 6 chiffres envoyé à votre email.
                                </p>
                            </div>
                            
                            <button
                                type="submit"
                                disabled={loading || codeDigits.some(digit => digit === '')}
                                className={`btn btn-primary btn-md w-full mt-6 ${loading ? "loading" : ""}`}
                            >
                                {loading ? "Vérification..." : "Vérifier le code"}
                            </button>
                            
                            <div className="text-center mt-6">
                                <p className="text-sm mb-2 text-gray-300">Vous n'avez pas reçu de code?</p>
                                <button
                                    type="button"
                                    onClick={handleResendCode}
                                    className="btn btn-outline btn-sm"
                                    disabled={resendLoading || countdown > 0}
                                >
                                    {countdown > 0 
                                        ? `Renvoyer le code (${countdown}s)` 
                                        : resendLoading 
                                            ? 'Envoi...' 
                                            : 'Renvoyer le code'}
                                </button>
                            </div>
                        </form>
                    )}

                    {step === 3 && (
                        <form onSubmit={handleResetPassword}>
                            <h2 className="text-2xl font-bold text-center mb-6 text-primary">Nouveau mot de passe</h2>
                            <p className="text-center text-white mb-6">
                                Choisissez un nouveau mot de passe sécurisé.
                            </p>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text text-white font-medium">Nouveau mot de passe</span>
                                </label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    className="input input-bordered input-md w-full"
                                    placeholder="••••••••"
                                />
                                <label className="label">
                                    <span className="label-text-alt text-gray-300">
                                        Min. 8 caractères avec au moins un chiffre et un caractère spécial
                                    </span>
                                </label>
                            </div>
                            
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text text-white font-medium">Confirmer le mot de passe</span>
                                </label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    className="input input-bordered input-md w-full"
                                    placeholder="••••••••"
                                />
                                <label className="label">
                                    <span className="label-text-alt text-gray-300">
                                        Doit correspondre au mot de passe ci-dessus
                                    </span>
                                </label>
                            </div>
                            
                            <button
                                type="submit"
                                disabled={loading}
                                className={`btn btn-primary btn-md w-full mt-6 ${loading ? "loading" : ""}`}
                            >
                                {loading ? "Mise à jour..." : "Réinitialiser"}
                            </button>
                            
                            {/* Password Requirements */}
                            <div className="mt-6 p-4 bg-base-200 rounded-lg">
                                <h3 className="text-sm font-medium mb-2 text-white">Exigences de mot de passe :</h3>
                                <ul className="list-disc pl-5 text-xs space-y-1 text-gray-300">
                                    <li>Au moins 8 caractères</li>
                                    <li>Au moins un chiffre (0-9)</li>
                                    <li>Au moins un caractère spécial (!@#$%^&*)</li>
                                </ul>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForgetPassword;
