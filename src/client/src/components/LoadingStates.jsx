import { Skeleton, Box, Card, CardContent } from '@mui/material';

export const JobCardSkeleton = () => (
  <Card>
    <CardContent>
      <Skeleton variant="text" width="60%" height={32} />
      <Skeleton variant="text" width="40%" height={24} />
      <Box sx={{ mt: 2 }}>
        <Skeleton variant="rectangular" height={100} />
      </Box>
      <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
        <Skeleton variant="rounded" width={80} height={32} />
        <Skeleton variant="rounded" width={80} height={32} />
      </Box>
    </CardContent>
  </Card>
);

export const ProfileSkeleton = () => (
  <Box>
    <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
      <Skeleton variant="circular" width={100} height={100} />
      <Box sx={{ flex: 1 }}>
        <Skeleton variant="text" width="40%" height={36} />
        <Skeleton variant="text" width="60%" height={24} />
        <Skeleton variant="text" width="30%" height={20} />
      </Box>
    </Box>
    <Skeleton variant="rectangular" height={200} />
  </Box>
);

export const DashboardSkeleton = () => (
  <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
    {[1, 2, 3, 4].map((i) => (
      <Card key={i}>
        <CardContent>
          <Skeleton variant="text" width="70%" height={28} />
          <Skeleton variant="text" width="40%" height={48} />
        </CardContent>
      </Card>
    ))}
  </Box>
);
