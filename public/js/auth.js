// public/js/auth.js
async function initAuth() {
    // Supabase JS handles session persistence automatically in localStorage
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
        console.error("Auth session error:", error);
        return null;
    }

    if (session) {
        return {
            user: session.user,
            token: session.access_token
        };
    }
    return null;
}

async function login() {
    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin + '/app.html'
        }
    });
    if (error) alert("Login error: " + error.message);
}

async function logout() {
    const { error } = await supabase.auth.signOut();
    if (error) console.error("Logout error:", error);
    window.location.href = 'login.html';
}
