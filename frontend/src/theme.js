// frontend/src/theme.js
// Premium "aqua glass" theme: frosted translucent surfaces floating over a
// deep teal gradient. Light frosted panels keep MUI form controls readable.
import { createTheme } from '@mui/material/styles';

const GLASS_BG = 'rgba(255, 255, 255, 0.55)';
const GLASS_BORDER = '1px solid rgba(255, 255, 255, 0.6)';
const GLASS_SHADOW = '0 20px 50px rgba(4, 30, 45, 0.28)';

const theme = createTheme({
    palette: {
        mode: 'light',
        primary: { main: '#1e3a8a', light: '#3b5bb5', dark: '#152c6b' },
        secondary: { main: '#3d6fd6' },
        background: { default: 'rgba(0,0,0,0)', paper: GLASS_BG },
        text: { primary: '#0d1b33', secondary: '#3a4a63' },
    },
    shape: { borderRadius: 16 },
    typography: {
        fontFamily: '"Inter", "Roboto", "Segoe UI", system-ui, sans-serif',
        h4: { fontWeight: 800, letterSpacing: '-0.02em' },
        h5: { fontWeight: 700, letterSpacing: '-0.01em' },
        h6: { fontWeight: 700, letterSpacing: '-0.01em' },
        button: { textTransform: 'none', fontWeight: 600 },
    },
    components: {
        MuiCssBaseline: {
            styleOverrides: {
                body: {
                    minHeight: '100vh',
                    color: '#0d1b33',
                    background:
                        'radial-gradient(1200px 600px at 8% -10%, rgba(59,91,181,0.40), transparent),' +
                        'radial-gradient(1000px 700px at 112% 8%, rgba(43,79,162,0.35), transparent),' +
                        'linear-gradient(135deg, #0a1424 0%, #0f2547 48%, #1b3a6b 100%)',
                    backgroundAttachment: 'fixed',
                },
                '::-webkit-scrollbar': { width: 10, height: 10 },
                '::-webkit-scrollbar-thumb': {
                    background: 'rgba(255,255,255,0.35)',
                    borderRadius: 8,
                },
            },
        },
        MuiAppBar: {
            defaultProps: { elevation: 0 },
            styleOverrides: {
                root: {
                    background: 'rgba(10, 22, 45, 0.6)',
                    backdropFilter: 'blur(18px)',
                    WebkitBackdropFilter: 'blur(18px)',
                    borderBottom: '1px solid rgba(255,255,255,0.12)',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundColor: GLASS_BG,
                    backgroundImage: 'none',
                    backdropFilter: 'blur(22px)',
                    WebkitBackdropFilter: 'blur(22px)',
                    border: GLASS_BORDER,
                    boxShadow: GLASS_SHADOW,
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: { borderRadius: 12, paddingInline: 22, paddingBlock: 8 },
                containedPrimary: {
                    background: 'linear-gradient(135deg, #2b4fa2, #14275c)',
                    boxShadow: '0 8px 20px rgba(20, 39, 92, 0.4)',
                    '&:hover': { background: 'linear-gradient(135deg, #3760bd, #1a3372)' },
                },
            },
        },
        MuiOutlinedInput: {
            styleOverrides: {
                root: {
                    backgroundColor: 'rgba(255,255,255,0.5)',
                    borderRadius: 12,
                    '& fieldset': { borderColor: 'rgba(11,35,48,0.15)' },
                },
            },
        },
        MuiChip: {
            styleOverrides: { root: { fontWeight: 600, backdropFilter: 'blur(6px)' } },
        },
        MuiDialog: {
            styleOverrides: {
                paper: { backgroundColor: 'rgba(255,255,255,0.75)' },
            },
        },
        MuiTab: {
            styleOverrides: { root: { textTransform: 'none', fontWeight: 600 } },
        },
    },
});

export default theme;
