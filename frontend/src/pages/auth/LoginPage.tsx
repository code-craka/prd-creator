import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { authSchemas } from 'prd-creator-shared';
import { useAuthStore } from '../../stores/authStore';
import { authService, LoginRequest } from '../../services/authService';
import { Eye, EyeOff, FileText, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginRequest>({
    resolver: zodResolver(authSchemas.login),
  });

  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: (data) => {
      setAuth(data.user, data.token);
      toast.success('Welcome back!');
      navigate('/dashboard');
    },
    onError: () => {
      toast.error('Invalid email or password');
    },
  });

  const onSubmit = (data: LoginRequest) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen animated-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <FileText className="h-10 w-10 text-blue-400" />
            <span className="text-2xl font-bold text-white">PRD Creator</span>
          </div>
          <p className="text-gray-300">
            Transform ideas into professional PRDs
          </p>
        </div>

        {/* Login Form */}
        <div className="glass-card p-8">
          <h1 className="text-2xl font-bold text-white mb-6 text-center">
            Welcome Back
          </h1>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email */}
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email Address
              </label>
              <input
                {...register('email')}
                type="email"
                id="email"
                className="form-input"
                placeholder="Enter your email"
                disabled={loginMutation.isPending}
              />
              {errors.email && (
                <p className="form-error">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  className="form-input pr-10"
                  placeholder="Enter your password"
                  disabled={loginMutation.isPending}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="form-error">{errors.password.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full glass-button-primary py-3 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loginMutation.isPending ? (
                <div className="flex items-center justify-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Signing in...</span>
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Links */}
          <div className="mt-6 text-center space-y-2">
            <p className="text-gray-300">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="text-blue-400 hover:text-blue-300 font-medium"
              >
                Sign up
              </Link>
            </p>
            <Link
              to="/gallery"
              className="text-gray-400 hover:text-gray-300 text-sm"
            >
              Browse Public PRDs
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};