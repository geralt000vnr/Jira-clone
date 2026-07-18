const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const issueRoutes = require('./routes/issueRoutes');
const sprintRoutes = require('./routes/sprintRoutes');
const commentRoutes = require('./routes/commentRoutes'); // mounts /issues/:issueId/comments and /comments/:id
const attachmentRoutes = require('./routes/attachmentRoutes'); // mounts /issues/:issueId/attachments and /attachments/:id
const worklogRoutes = require('./routes/worklogRoutes'); // mounts /issues/:id/worklogs and /worklogs/:id
const savedFilterRoutes = require('./routes/savedFilterRoutes'); // mounts /projects/:projectId/saved-filters and /saved-filters/:id
const userRoutes = require('./routes/userRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ success: true }));

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/sprints', sprintRoutes);
app.use('/api', commentRoutes); // note: comment routes define their own /issues/... and /comments/... prefixes
app.use('/api', attachmentRoutes); // same for attachments
app.use('/api', worklogRoutes); // same for worklogs
app.use('/api', savedFilterRoutes); // same for saved filters
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use(errorHandler);

module.exports = app;
