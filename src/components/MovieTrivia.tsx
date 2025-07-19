import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { X, Brain, Star, Clock, Award } from "lucide-react";
import { Movie } from "@/lib/tmdb";

interface MovieTriviaProps {
  movie: Movie;
  isOpen: boolean;
  onClose: () => void;
}

interface TriviaQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface MovieFact {
  id: string;
  title: string;
  content: string;
  category: 'production' | 'cast' | 'trivia' | 'awards' | 'box_office';
  icon: React.ReactNode;
}

export const MovieTrivia = ({ movie, isOpen, onClose }: MovieTriviaProps) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizComplete, setQuizComplete] = useState(false);
  const [activeTab, setActiveTab] = useState<'quiz' | 'facts'>('quiz');

  // Mock trivia questions (in real app, fetch from TMDb or generate with AI)
  const triviaQuestions: TriviaQuestion[] = [
    {
      id: '1',
      question: `What year was "${movie.title}" released?`,
      options: ['2018', '2019', '2020', '2021'],
      correctAnswer: 1,
      explanation: `${movie.title} was released in ${new Date(movie.release_date).getFullYear()}.`,
      difficulty: 'easy'
    },
    {
      id: '2',
      question: `What is the IMDb rating of "${movie.title}"?`,
      options: ['7.5', '8.1', '8.8', '9.2'],
      correctAnswer: 2,
      explanation: `The movie has a rating of ${movie.vote_average}/10 on TMDb.`,
      difficulty: 'medium'
    },
    {
      id: '3',
      question: `Which genre best describes "${movie.title}"?`,
      options: ['Action', 'Comedy', 'Drama', 'Horror'],
      correctAnswer: 0,
      explanation: 'Based on the movie\'s genre classification.',
      difficulty: 'easy'
    }
  ];

  // Mock movie facts
  const movieFacts: MovieFact[] = [
    {
      id: '1',
      title: 'Box Office Success',
      content: `${movie.title} was a commercial success, grossing over $850 million worldwide.`,
      category: 'box_office',
      icon: <Award className="h-4 w-4" />
    },
    {
      id: '2',
      title: 'Production Budget',
      content: 'The movie had an estimated production budget of $63 million.',
      category: 'production',
      icon: <Clock className="h-4 w-4" />
    },
    {
      id: '3',
      title: 'Critical Reception',
      content: `With a ${movie.vote_average}/10 rating, the film received widespread critical acclaim.`,
      category: 'awards',
      icon: <Star className="h-4 w-4" />
    },
    {
      id: '4',
      title: 'Filming Location',
      content: 'Primary filming took place across multiple international locations.',
      category: 'production',
      icon: <Clock className="h-4 w-4" />
    }
  ];

  const handleAnswerSelect = (answerIndex: number) => {
    if (showAnswer) return;
    
    setSelectedAnswer(answerIndex);
    setShowAnswer(true);
    
    if (answerIndex === triviaQuestions[currentQuestion].correctAnswer) {
      setScore(score + 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestion < triviaQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setShowAnswer(false);
      setSelectedAnswer(null);
    } else {
      setQuizComplete(true);
    }
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setScore(0);
    setShowAnswer(false);
    setSelectedAnswer(null);
    setQuizComplete(false);
  };

  if (!isOpen) return null;

  const progress = ((currentQuestion + 1) / triviaQuestions.length) * 100;
  const current = triviaQuestions[currentQuestion];

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-card border border-border">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Brain className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">
                {movie.title} - Movie Trivia
              </h2>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 mb-6 bg-muted p-1 rounded-lg">
            <Button
              variant={activeTab === 'quiz' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('quiz')}
              className="flex-1"
            >
              Quiz
            </Button>
            <Button
              variant={activeTab === 'facts' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('facts')}
              className="flex-1"
            >
              Fun Facts
            </Button>
          </div>

          {activeTab === 'quiz' && (
            <div>
              {!quizComplete ? (
                <div>
                  {/* Progress */}
                  <div className="mb-6">
                    <div className="flex justify-between text-sm text-muted-foreground mb-2">
                      <span>Question {currentQuestion + 1} of {triviaQuestions.length}</span>
                      <span>Score: {score}/{triviaQuestions.length}</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  {/* Question */}
                  <div className="mb-6">
                    <Badge variant="outline" className="mb-3 capitalize">
                      {current.difficulty}
                    </Badge>
                    <h3 className="text-lg font-medium text-foreground mb-4">
                      {current.question}
                    </h3>
                  </div>

                  {/* Options */}
                  <div className="space-y-3 mb-6">
                    {current.options.map((option, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className={`w-full justify-start p-4 h-auto transition-colors ${
                          showAnswer
                            ? index === current.correctAnswer
                              ? 'border-green-500 bg-green-500/10 text-green-700 dark:text-green-300'
                              : selectedAnswer === index && index !== current.correctAnswer
                              ? 'border-red-500 bg-red-500/10 text-red-700 dark:text-red-300'
                              : 'opacity-50'
                            : selectedAnswer === index
                            ? 'border-primary bg-primary/10'
                            : 'hover:bg-muted'
                        }`}
                        onClick={() => handleAnswerSelect(index)}
                        disabled={showAnswer}
                      >
                        <span className="mr-3 font-mono text-sm">
                          {String.fromCharCode(65 + index)}
                        </span>
                        {option}
                      </Button>
                    ))}
                  </div>

                  {/* Explanation */}
                  {showAnswer && (
                    <div className="mb-6 p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        {current.explanation}
                      </p>
                    </div>
                  )}

                  {/* Next Button */}
                  {showAnswer && (
                    <Button onClick={handleNextQuestion} className="w-full">
                      {currentQuestion < triviaQuestions.length - 1 ? 'Next Question' : 'View Results'}
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-center">
                  <div className="mb-6">
                    <div className="text-6xl mb-4">
                      {score === triviaQuestions.length ? '🏆' : score >= triviaQuestions.length / 2 ? '⭐' : '📚'}
                    </div>
                    <h3 className="text-2xl font-semibold text-foreground mb-2">
                      Quiz Complete!
                    </h3>
                    <p className="text-lg text-muted-foreground">
                      You scored {score} out of {triviaQuestions.length}
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <Button onClick={resetQuiz} className="w-full">
                      Try Again
                    </Button>
                    <Button variant="outline" onClick={() => setActiveTab('facts')} className="w-full">
                      Explore Fun Facts
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'facts' && (
            <div className="space-y-4">
              {movieFacts.map((fact) => (
                <Card key={fact.id} className="p-4 bg-muted/50">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 p-2 bg-primary/10 rounded-lg text-primary">
                      {fact.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground mb-1">
                        {fact.title}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {fact.content}
                      </p>
                      <Badge variant="outline" className="mt-2 text-xs">
                        {fact.category.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};