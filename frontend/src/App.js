import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  TextField,
  IconButton,
  Button,
  Paper,
  Divider,
  CircularProgress,
  Tooltip,
  InputAdornment,
  useMediaQuery,
  useTheme,
  Snackbar,
  Alert,
  LinearProgress,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AddIcon from '@mui/icons-material/Add';
import ChatIcon from '@mui/icons-material/Chat';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CancelIcon from '@mui/icons-material/Cancel';
import axios from 'axios';

const drawerWidth = 260;

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [darkMode, setDarkMode] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [isDragging, setIsDragging] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const cancelTokenSourceRef = useRef(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const userMessage = {
      text: input,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    try {
      const response = await axios.post('http://localhost:8000/api/chat', {
        message: input,
      });
      const botMessage = {
        text: response.data.response,
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          text: 'Sorry, an error occurred. Please try again.',
          sender: 'bot',
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    setIsUploading(true);
    setUploadProgress(0);
    cancelTokenSourceRef.current = axios.CancelToken.source();

    // Simulate progress for UX (replace with real progress if backend supports)
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 10;
      });
    }, 500);

    const formData = new FormData();
    formData.append('file', file);
    try {
      await axios.post('http://localhost:8000/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        cancelToken: cancelTokenSourceRef.current.token,
      });
      setUploadProgress(100);
      setMessages((prev) => [
        ...prev,
        {
          text: `Successfully uploaded file ${file.name}!`,
          sender: 'bot',
          timestamp: new Date().toLocaleTimeString(),
          isFileMessage: true,
        },
      ]);
      setSnackbar({
        open: true,
        message: `Successfully uploaded ${file.name}!`,
        severity: 'success',
      });
    } catch (error) {
      if (axios.isCancel(error)) {
        setSnackbar({
          open: true,
          message: 'Upload cancelled.',
          severity: 'info',
        });
      } else {
        setMessages((prev) => [
          ...prev,
          {
            text: `Error uploading file ${file.name}. Please try again.`,
            sender: 'bot',
            timestamp: new Date().toLocaleTimeString(),
            isFileMessage: true,
          },
        ]);
        setSnackbar({
          open: true,
          message: `Error uploading file ${file.name}.`,
          severity: 'error',
        });
      }
    } finally {
      clearInterval(progressInterval);
      setIsUploading(false);
      setUploadProgress(0);
      cancelTokenSourceRef.current = null;
    }
  };

  const handleCancelUpload = () => {
    if (cancelTokenSourceRef.current) {
      cancelTokenSourceRef.current.cancel('Upload cancelled by user');
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const startNewChat = () => setMessages([]);

  const copyMessage = (text) => {
    navigator.clipboard.writeText(text);
    setSnackbar({
      open: true,
      message: 'Message copied!',
      severity: 'success',
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        bgcolor: darkMode ? '#181818' : '#ffffff',
        fontFamily: '"Inter", sans-serif',
      }}
    >
      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* AppBar */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: darkMode ? '#212121' : '#ffffff',
          borderBottom: `1px solid ${darkMode ? '#333' : '#e0e0e0'}`,
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 500,
                color: darkMode ? '#40c4ff' : '#007bff',
                fontSize: '1.25rem',
              }}
            >
              RAG-Chatbot
            </Typography>
            <IconButton
              onClick={startNewChat}
              sx={{
                ml: 1,
                color: darkMode ? '#40c4ff' : '#007bff',
              }}
            >
              <AddIcon />
            </IconButton>
          </Box>
          <Box>
            <Tooltip title={darkMode ? 'Light Mode' : 'Dark Mode'}>
              <IconButton
                onClick={() => setDarkMode((d) => !d)}
                sx={{ color: darkMode ? '#fff' : '#222' }}
              >
                {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Chat Area */}
      <Box
        sx={{
          flex: 1,
          p: { xs: 2, sm: 3 },
          overflowY: 'auto',
          bgcolor: darkMode ? '#181818' : '#f0f2f5',
          position: 'relative',
        }}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isDragging && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              bgcolor: darkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              border: `2px dashed ${darkMode ? '#40c4ff' : '#007bff'}`,
              borderRadius: 2,
              transition: 'opacity 0.2s',
            }}
          >
            <Typography variant="h6" sx={{ color: '#fff' }}>
              Drop file here
            </Typography>
          </Box>
        )}

        <Box sx={{ maxWidth: 800, mx: 'auto' }}>
          {messages.map((msg, idx) => (
            <Box
              key={idx}
              sx={{
                display: 'flex',
                justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                mb: 1.5,
                animation: 'fadeIn 0.2s ease-in',
                '@keyframes fadeIn': {
                  from: { opacity: 0, transform: 'translateY(8px)' },
                  to: { opacity: 1, transform: 'translateY(0)' },
                },
              }}
            >
              <Paper
                sx={{
                  p: 1.5,
                  bgcolor:
                    msg.sender === 'user'
                      ? darkMode
                        ? '#40c4ff'
                        : '#007bff'
                      : darkMode
                      ? '#212121'
                      : '#ffffff',
                  color: msg.sender === 'user' ? '#fff' : darkMode ? '#fff' : '#222',
                  borderRadius: 5,
                  maxWidth: '75%',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  position: 'relative',
                  '&:hover .message-actions': {
                    opacity: 1,
                  },
                }}
              >
                <Typography variant="body1" sx={{ fontSize: '0.95rem', whiteSpace: 'pre-wrap' }}>
                  {msg.text}
                </Typography>
                <Box
                  className="message-actions"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    mt: 0.5,
                    opacity: 0,
                    transition: 'opacity 0.2s',
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: msg.sender === 'user' ? 'rgba(255,255,255,0.7)' : darkMode ? '#aaa' : '#666',
                      mr: 1,
                    }}
                  >
                    {msg.timestamp}
                  </Typography>
                  <Tooltip title="Copy">
                    <IconButton
                      size="small"
                      onClick={() => copyMessage(msg.text)}
                      sx={{ color: msg.sender === 'user' ? '#fff' : darkMode ? '#aaa' : '#666' }}
                    >
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Paper>
            </Box>
          ))}
          {isLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: 2 }}>
              <CircularProgress size={20} sx={{ color: darkMode ? '#40c4ff' : '#007bff' }} />
            </Box>
          )}
          {isUploading && (
            <Box sx={{ mt: 2, maxWidth: 800, mx: 'auto' }}>
              <LinearProgress
                variant="determinate"
                value={uploadProgress}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  '& .MuiLinearProgress-bar': {
                    bgcolor: darkMode ? '#40c4ff' : '#007bff',
                  },
                }}
              />
              <IconButton
                onClick={handleCancelUpload}
                sx={{ color: darkMode ? '#ff5252' : '#d32f2f', mt: 1 }}
              >
                <CancelIcon fontSize="small" />
              </IconButton>
            </Box>
          )}
          <div ref={messagesEndRef} />
        </Box>
      </Box>

      {/* Input Area */}
      <Box
        component="form"
        onSubmit={handleSend}
        sx={{
          p: { xs: 1, sm: 2 },
          bgcolor: darkMode ? '#212121' : '#ffffff',
          borderTop: `1px solid ${darkMode ? '#333' : '#e0e0e0'}`,
        }}
      >
        <Box sx={{ maxWidth: 800, mx: 'auto', display: 'flex', alignItems: 'center' }}>
          <IconButton
            component="label"
            sx={{ color: darkMode ? '#40c4ff' : '#007bff', mr: 1 }}
            disabled={isUploading}
          >
            <AttachFileIcon fontSize="small" />
            <input
              type="file"
              hidden
              ref={fileInputRef}
              onChange={(e) => handleFileUpload(e.target.files[0])}
              disabled={isUploading}
              accept=".pdf,.txt,.docx"
            />
          </IconButton>
          <TextField
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            variant="outlined"
            fullWidth
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 5,
                bgcolor: darkMode ? '#333' : '#f0f2f5',
                '& fieldset': { border: 'none' },
                '&:hover fieldset': { border: 'none' },
                '&.Mui-focused fieldset': { border: 'none' },
              },
              '& .MuiInputBase-input': {
                color: darkMode ? '#fff' : '#222',
                fontSize: '0.95rem',
              },
            }}
            InputProps={{
              endAdornment: input.trim() && (
                <IconButton
                  type="submit"
                  disabled={isLoading}
                  sx={{ color: darkMode ? '#40c4ff' : '#007bff' }}
                >
                  <SendIcon fontSize="small" />
                </IconButton>
              ),
            }}
            disabled={isLoading}
          />
        </Box>
      </Box>
    </Box>
  );
}

export default App;