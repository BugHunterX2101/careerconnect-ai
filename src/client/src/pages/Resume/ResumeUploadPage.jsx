import React, { useState, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  LinearProgress,
  Alert,
  Chip,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme
} from '@mui/material';
import {
  CloudUpload,
  Description,
  CheckCircle,
  Error,
  Info,
  Upload,
  Delete,
  Visibility,
  Edit,
  TrendingUp,
  Work,
  School,
  Star
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';

const ResumeUploadPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      setUploadedFile(file);
      setError(null);
      handleFileUpload(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    multiple: false
  });

  const handleFileUpload = async (file) => {
    setIsUploading(true);
    setUploadProgress(0);

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      // Simulate analysis result
      setTimeout(() => {
        setAnalysisResult({
          id: 'resume-123',
          title: file.name.replace(/\.[^/.]+$/, ''),
          status: 'completed',
          analysis: {
            skills: ['JavaScript', 'React', 'Node.js', 'Python', 'MongoDB', 'AWS'],
            experience: '5 years',
            education: 'Bachelor\'s in Computer Science',
            summary: 'Experienced software engineer with expertise in full-stack development...',
            recommendations: [
              'Consider highlighting leadership experience',
              'Add more quantifiable achievements',
              'Include certifications section'
            ]
          },
          jobRecommendations: [
            {
              id: 1,
              title: 'Senior Software Engineer',
              company: 'Tech Corp',
              location: 'San Francisco, CA',
              match: 95,
              salary: '$120k - $150k'
            },
            {
              id: 2,
              title: 'Full Stack Developer',
              company: 'Startup Inc',
              location: 'Remote',
              match: 88,
              salary: '$100k - $130k'
            }
          ]
        });
        setIsUploading(false);
      }, 1000);

    } catch (err) {
      setError('Failed to upload resume. Please try again.');
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = () => {
    setUploadedFile(null);
    setAnalysisResult(null);
    setUploadProgress(0);
    setError(null);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
        Upload Resume
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Upload your resume and get AI-powered analysis and job recommendations
      </Typography>

      <Grid container spacing={3}>
        {/* Upload Section */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                Upload Resume
              </Typography>
              
              {!uploadedFile ? (
                <Paper
                  {...getRootProps()}
                  sx={{
                    border: '2px dashed',
                    borderColor: isDragActive ? 'primary.main' : 'grey.300',
                    borderRadius: 2,
                    p: 4,
                    textAlign: 'center',
                    cursor: 'pointer',
                    backgroundColor: isDragActive ? 'primary.light' : 'grey.50',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      borderColor: 'primary.main',
                      backgroundColor: 'primary.light'
                    }
                  }}
                >
                  <input {...getInputProps()} />
                  <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    {isDragActive ? 'Drop your resume here' : 'Drag & drop your resume'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    or click to browse files
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Supports PDF, DOC, DOCX, TXT (Max 10MB)
                  </Typography>
                </Paper>
              ) : (
                <Box>
                  <Paper sx={{ p: 2, mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Description sx={{ mr: 2, color: 'primary.main' }} />
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                            {uploadedFile.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatFileSize(uploadedFile.size)}
                          </Typography>
                        </Box>
                      </Box>
                      <Button
                        startIcon={<Delete />}
                        onClick={handleDelete}
                        color="error"
                        size="small"
                      >
                        Remove
                      </Button>
                    </Box>
                  </Paper>

                  {isUploading && (
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Uploading...</Typography>
                        <Typography variant="body2">{uploadProgress}%</Typography>
                      </Box>
                      <LinearProgress variant="determinate" value={uploadProgress} />
                    </Box>
                  )}

                  {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {error}
                    </Alert>
                  )}
                </Box>
              )}

              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  <strong>Supported formats:</strong> PDF, DOC, DOCX, TXT
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Maximum size:</strong> 10MB
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Analysis Results */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                AI Analysis Results
              </Typography>

              {!analysisResult ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Info sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="body1" color="text.secondary">
                    Upload a resume to see AI analysis results
                  </Typography>
                </Box>
              ) : (
                <Box>
                  {/* Skills */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                      Skills Detected
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {analysisResult.analysis.skills.map((skill, index) => (
                        <Chip
                          key={index}
                          label={skill}
                          color="primary"
                          variant="outlined"
                          size="small"
                        />
                      ))}
                    </Box>
                  </Box>

                  {/* Summary */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                      Summary
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {analysisResult.analysis.summary}
                    </Typography>
                  </Box>

                  {/* Recommendations */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                      AI Recommendations
                    </Typography>
                    <List dense>
                      {analysisResult.analysis.recommendations.map((rec, index) => (
                        <ListItem key={index} sx={{ px: 0 }}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <Star sx={{ fontSize: 16, color: 'warning.main' }} />
                          </ListItemIcon>
                          <ListItemText
                            primary={rec}
                            primaryTypographyProps={{ variant: 'body2' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>

                  {/* Action Buttons */}
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                      variant="contained"
                      startIcon={<Visibility />}
                      onClick={() => navigate(`/resume/${analysisResult.id}`)}
                      fullWidth
                    >
                      View Analysis
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<Edit />}
                      onClick={() => navigate(`/resume/${analysisResult.id}/edit`)}
                      fullWidth
                    >
                      Edit Resume
                    </Button>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Job Recommendations */}
      {analysisResult && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Job Recommendations
              </Typography>
              <Button
                endIcon={<TrendingUp />}
                onClick={() => navigate('/jobs/recommendations')}
                sx={{ textTransform: 'none' }}
              >
                View All
              </Button>
            </Box>

            <Grid container spacing={2}>
              {analysisResult.jobRecommendations.map((job) => (
                <Grid item xs={12} sm={6} key={job.id}>
                  <Paper sx={{ p: 2, border: 1, borderColor: 'divider' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        {job.title}
                      </Typography>
                      <Chip
                        label={`${job.match}% match`}
                        color="success"
                        size="small"
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {job.company} • {job.location}
                    </Typography>
                    <Typography variant="body2" color="primary" sx={{ fontWeight: 'bold' }}>
                      {job.salary}
                    </Typography>
                    <Button
                      size="small"
                      onClick={() => navigate(`/jobs/${job.id}`)}
                      sx={{ mt: 1, textTransform: 'none' }}
                    >
                      View Job
                    </Button>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default ResumeUploadPage;
