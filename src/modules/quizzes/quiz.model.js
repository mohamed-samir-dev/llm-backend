const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  type: { type: String, enum: ['multiple_choice', 'true_false', 'code'], required: true },
  question: { type: String, required: true },
  options: [{ text: String, isCorrect: Boolean }],
  correctAnswer: String, // for true_false and code
  explanation: String,
  points: { type: Number, default: 1 },
}, { _id: true });

const quizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  section: { type: mongoose.Schema.Types.ObjectId, ref: 'Section' },
  questions: [questionSchema],
  passingScore: { type: Number, default: 70 }, // percentage
  maxAttempts: { type: Number, default: 3 },
  timeLimit: { type: Number }, // in minutes
  isPublished: { type: Boolean, default: false },
}, { timestamps: true });

// Quiz Attempt
const quizAttemptSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  answers: [{
    question: mongoose.Schema.Types.ObjectId,
    answer: String,
    isCorrect: Boolean,
    points: Number,
  }],
  score: Number,
  percentage: Number,
  passed: Boolean,
  attemptNumber: Number,
  completedAt: Date,
}, { timestamps: true });

quizAttemptSchema.index({ user: 1, quiz: 1 });

module.exports = {
  Quiz: mongoose.model('Quiz', quizSchema),
  QuizAttempt: mongoose.model('QuizAttempt', quizAttemptSchema),
};
