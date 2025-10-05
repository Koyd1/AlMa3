import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../integrations/supabase/client.js";
import { useToast } from "./use-toast";

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, session) => {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithEmail = async (email, password) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "Welcome back!",
        description: "You've successfully signed in",
      });

      navigate("/dashboard");
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Unable to sign in",
        variant: "destructive",
      });
      throw error;
    }
  };

  const signUpWithEmail = async (email, password) => {
    try {
      const redirectUrl = `${window.location.origin}/dashboard`;

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: redirectUrl },
      });

      if (error) throw error;

      toast({
        title: "Account created!",
        description: "Welcome to AI Orchestrator",
      });

      navigate("/dashboard");
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Unable to create account",
        variant: "destructive",
      });
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const redirectUrl = `${window.location.origin}/dashboard`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: redirectUrl },
      });

      if (error) throw error;
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Google sign-in failed",
        variant: "destructive",
      });
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      toast({
        title: "Signed out",
        description: "You've been signed out successfully",
      });

      navigate("/");
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Unable to sign out",
        variant: "destructive",
      });
    }
  };

  return {
    user,
    session,
    loading,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signOut,
  };
};
