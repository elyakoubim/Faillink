<template>
    <div class="min-h-screen bg-gradient-to-br from-sky-50 to-blue-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8">
        <!-- Header -->
        <div class="text-center">
          <div class="mx-auto h-16 w-16 bg-sky-600 rounded-full flex items-center justify-center mb-4">
            <i class="fas fa-sign-in-alt text-white text-2xl"></i>
          </div>
          <h2 class="text-3xl font-bold text-gray-900 mb-2">
            Welcome Back
          </h2>
          <p class="text-gray-600">
            Sign in to your Faillink account
          </p>
        </div>
  
        <!-- Login Form -->
        <div class="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          <form @submit.prevent="handleLogin" class="space-y-6">
            <!-- Email -->
            <div>
              <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i class="fas fa-envelope text-gray-400"></i>
                </div>
                <input
                  id="email"
                  v-model="form.email"
                  type="email"
                  required
                  :class="[
                    'block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors',
                    errors.email 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                      : 'border-gray-300 focus:border-sky-500 focus:ring-sky-200'
                  ]"
                  placeholder="Enter your email address"
                  @blur="validateField('email')"
                  @input="clearError('email')"
                />
              </div>
              <p v-if="errors.email" class="mt-1 text-sm text-red-600">
                {{ errors.email }}
              </p>
            </div>
  
            <!-- Password -->
            <div>
              <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i class="fas fa-lock text-gray-400"></i>
                </div>
                <input
                  id="password"
                  v-model="form.password"
                  :type="showPassword ? 'text' : 'password'"
                  required
                  :class="[
                    'block w-full pl-10 pr-10 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors',
                    errors.password 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                      : 'border-gray-300 focus:border-sky-500 focus:ring-sky-200'
                  ]"
                  placeholder="Enter your password"
                  @blur="validateField('password')"
                  @input="clearError('password')"
                />
                <button
                  type="button"
                  @click="togglePasswordVisibility"
                  class="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'" class="text-gray-400 hover:text-gray-600"></i>
                </button>
              </div>
              <p v-if="errors.password" class="mt-1 text-sm text-red-600">
                {{ errors.password }}
              </p>
            </div>
  
            <!-- Remember Me & Forgot Password -->
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <input
                  id="remember"
                  v-model="form.rememberMe"
                  type="checkbox"
                  class="h-4 w-4 text-sky-600 focus:ring-sky-500 border-gray-300 rounded"
                />
                <label for="remember" class="ml-2 text-sm text-gray-600">
                  Remember me
                </label>
              </div>
              <router-link 
                to="/forgot-password" 
                class="text-sm text-sky-600 hover:text-sky-700 font-medium transition-colors"
              >
                Forgot password?
              </router-link>
            </div>
  
            <!-- Error Message -->
            <transition name="fade">
              <div v-if="loginError" class="bg-red-50 border border-red-200 rounded-lg p-3">
                <div class="flex items-center">
                  <i class="fas fa-exclamation-circle text-red-500 mr-2"></i>
                  <p class="text-red-800 text-sm">
                    {{ loginError }}
                  </p>
                </div>
              </div>
            </transition>
  
            <!-- Submit Button -->
            <button
              type="submit"
              :disabled="isLoading || !isFormValid"
              :class="[
                'w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white transition-all duration-200',
                isLoading || !isFormValid
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transform hover:scale-105'
              ]"
            >
              <i v-if="isLoading" class="fas fa-spinner fa-spin mr-2"></i>
              {{ isLoading ? 'Signing In...' : 'Sign In' }}
            </button>
          </form>
  
          <!-- Divider -->
          <div class="mt-6">
            <div class="relative">
              <div class="absolute inset-0 flex items-center">
                <div class="w-full border-t border-gray-300"></div>
              </div>
              <div class="relative flex justify-center text-sm">
                <span class="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>
          </div>
  
          <!-- Social Login Buttons -->
          <div class="mt-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              @click="handleSocialLogin('google')"
              class="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
            >
              <i class="fab fa-google text-red-500 mr-2"></i>
              Google
            </button>
            <button
              type="button"
              @click="handleSocialLogin('github')"
              class="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
            >
              <i class="fab fa-github text-gray-900 mr-2"></i>
              GitHub
            </button>
          </div>
  
          <!-- Register Link -->
          <div class="mt-6 text-center">
            <p class="text-sm text-gray-600">
              Don't have an account?
              <router-link to="/register" class="font-medium text-sky-600 hover:text-sky-700 transition-colors">
                Create one here
              </router-link>
            </p>
          </div>
        </div>
  
        <!-- Demo Credentials -->
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div class="flex items-start">
            <i class="fas fa-info-circle text-blue-500 mr-3 mt-0.5"></i>
            <div>
              <h4 class="text-blue-800 font-medium text-sm mb-1">Demo Credentials</h4>
              <p class="text-blue-700 text-xs mb-2">Use these credentials to test the login:</p>
              <div class="space-y-1">
                <p class="text-blue-600 text-xs font-mono">Email: demo@faillink.com</p>
                <p class="text-blue-600 text-xs font-mono">Password: demo123456</p>
              </div>
              <button 
                @click="fillDemoCredentials"
                class="mt-2 text-blue-600 hover:text-blue-700 text-xs font-medium underline"
              >
                Click to fill automatically
              </button>
            </div>
          </div>
        </div>
  
        <!-- Success Message -->
        <transition name="fade">
          <div v-if="showSuccess" class="bg-green-50 border border-green-200 rounded-lg p-4">
            <div class="flex items-center">
              <i class="fas fa-check-circle text-green-500 mr-3"></i>
              <p class="text-green-800 font-medium">
                Login successful! Redirecting to dashboard...
              </p>
            </div>
          </div>
        </transition>
      </div>
    </div>
  </template>
  
  <script>
  import { ref, computed, reactive } from 'vue'
  import { useRouter } from 'vue-router'
  
  export default {
    name: 'LoginPage',
    setup() {
      const router = useRouter()
      const isLoading = ref(false)
      const showSuccess = ref(false)
      const showPassword = ref(false)
      const loginError = ref('')
  
      const form = reactive({
        email: '',
        password: '',
        rememberMe: false
      })
  
      const errors = reactive({
        email: '',
        password: ''
      })
  
      // Form validation
      const isFormValid = computed(() => {
        return form.email.trim() !== '' &&
               form.password.trim() !== '' &&
               Object.values(errors).every(error => error === '')
      })
  
      const validateField = (field) => {
        switch (field) {
          case 'email':
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            errors.email = !emailRegex.test(form.email) ? 'Please enter a valid email address' : ''
            break
          case 'password':
            errors.password = form.password.length < 6 ? 'Password must be at least 6 characters' : ''
            break
        }
      }
  
      const clearError = (field) => {
        errors[field] = ''
        loginError.value = ''
      }
  
      const togglePasswordVisibility = () => {
        showPassword.value = !showPassword.value
      }
  
      const fillDemoCredentials = () => {
        form.email = 'demo@faillink.com'
        form.password = 'demo123456'
        errors.email = ''
        errors.password = ''
        loginError.value = ''
      }
  
      const handleLogin = async () => {
        // Validate all fields
        Object.keys(errors).forEach(field => validateField(field))
  
        if (!isFormValid.value) {
          return
        }
  
        isLoading.value = true
        loginError.value = ''
  
        try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 1500))
          
          // Demo login logic
          if (form.email === 'demo@faillink.com' && form.password === 'demo123456') {
            showSuccess.value = true
            
            // Simulate successful login redirect
            setTimeout(() => {
              // Here you would typically:
              // 1. Store auth token
              // 2. Set user data in store
              // 3. Redirect to dashboard
              router.push('/dashboard')
            }, 1500)
          } else {
            // Simulate login failure
            loginError.value = 'Invalid email or password. Please try again.'
          }
  
          // Here you would make your actual API call
          // const response = await loginUser({
          //   email: form.email,
          //   password: form.password,
          //   rememberMe: form.rememberMe
          // })
          
        } catch (error) {
          console.error('Login failed:', error)
          loginError.value = 'An error occurred during login. Please try again.'
        } finally {
          isLoading.value = false
        }
      }
  
      const handleSocialLogin = async (provider) => {
        try {
          console.log(`Initiating ${provider} login...`)
          // Here you would integrate with your social auth provider
          // For example: Google OAuth, GitHub OAuth, etc.
          
          // Simulate social login
          loginError.value = ''
          alert(`${provider.charAt(0).toUpperCase() + provider.slice(1)} login would be implemented here`)
          
        } catch (error) {
          console.error(`${provider} login failed:`, error)
          loginError.value = `${provider} login failed. Please try again.`
        }
      }
  
      return {
        form,
        errors,
        isLoading,
        showSuccess,
        showPassword,
        loginError,
        isFormValid,
        validateField,
        clearError,
        togglePasswordVisibility,
        fillDemoCredentials,
        handleLogin,
        handleSocialLogin
      }
    }
  }
  </script>
  
  <style scoped>
  /* Fade transition */
  .fade-enter-active, .fade-leave-active {
    transition: opacity 0.3s ease;
  }
  
  .fade-enter-from, .fade-leave-to {
    opacity: 0;
  }
  
  /* Input focus animations */
  input:focus {
    transform: translateY(-1px);
  }
  
  /* Button hover animations */
  button:not(:disabled):hover {
    transform: translateY(-1px);
  }
  
  /* Custom checkbox styling */
  input[type="checkbox"]:checked {
    background-color: #0284c7;
    border-color: #0284c7;
  }
  
  /* Loading spinner animation */
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
  
  .fa-spin {
    animation: spin 1s linear infinite;
  }
  
  /* Responsive design */
  @media (max-width: 640px) {
    .max-w-md {
      max-width: 100%;
      margin: 0 1rem;
    }
  }
  
  /* Form input styling */
  input:focus {
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  /* Error state styling */
  input.border-red-300:focus {
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
  }
  
  /* Success message styling */
  .bg-green-50 {
    background-color: #f0fdf4;
  }
  
  /* Demo credentials styling */
  .bg-blue-50 {
    background-color: #eff6ff;
  }
  
  /* Social button hover effects */
  .hover\:bg-gray-50:hover {
    background-color: #f9fafb;
  }
  
  /* Link hover effects */
  a:hover {
    text-decoration: underline;
  }
  
  /* Checkbox custom styling */
  input[type="checkbox"] {
    accent-color: #0284c7;
  }
  
  /* Form container styling */
  .bg-white {
    backdrop-filter: blur(10px);
    background-color: rgba(255, 255, 255, 0.95);
  }
  
  /* Password visibility button */
  button[type="button"] {
    transition: color 0.2s ease;
  }
  
  button[type="button"]:hover {
    color: #374151;
  }
  
  /* Demo credentials button */
  .font-mono {
    font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace;
  }
  
  /* Error message styling */
  .bg-red-50 {
    background-color: #fef2f2;
  }
  
  /* Sky blue theme variables */
  :root {
    --sky-50: #f0f9ff;
    --sky-100: #e0f2fe;
    --sky-200: #bae6fd;
    --sky-500: #0ea5e9;
    --sky-600: #0284c7;
    --sky-700: #0369a1;
  }
  
  /* Form validation states */
  .transition-colors {
    transition-property: color, background-color, border-color;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 200ms;
  }
  
  /* Focus ring styling */
  .focus\:ring-sky-500:focus {
    --tw-ring-color: rgba(14, 165, 233, 0.5);
  }
  
  .focus\:ring-sky-200:focus {
    --tw-ring-color: rgba(186, 230, 253, 0.5);
  }
  
  /* Button disabled state */
  button:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
  
  /* Smooth scaling animation */
  .transform {
    transition: transform 0.2s ease;
  }
  
  .hover\:scale-105:hover {
    transform: scale(1.05);
  }
  </style>