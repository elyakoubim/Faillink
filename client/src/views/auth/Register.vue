<template>
    <div class="min-h-screen bg-gradient-to-br from-sky-50 to-blue-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8">
        <!-- Header -->
        <div class="text-center">
          <div class="mx-auto h-16 w-16 bg-sky-600 rounded-full flex items-center justify-center mb-4">
            <i class="fas fa-user-plus text-white text-2xl"></i>
          </div>
          <h2 class="text-3xl font-bold text-gray-900 mb-2">
            Join Faillink
          </h2>
          <p class="text-gray-600">
            Create your account to get started
          </p>
        </div>
  
        <!-- Registration Form -->
        <div class="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          <form @submit.prevent="handleRegister" class="space-y-6">
            <!-- Full Name -->
            <div>
              <label for="fullName" class="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i class="fas fa-user text-gray-400"></i>
                </div>
                <input
                  id="fullName"
                  v-model="form.fullName"
                  type="text"
                  required
                  :class="[
                    'block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors',
                    errors.fullName 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                      : 'border-gray-300 focus:border-sky-500 focus:ring-sky-200'
                  ]"
                  placeholder="Enter your full name"
                  @blur="validateField('fullName')"
                />
              </div>
              <p v-if="errors.fullName" class="mt-1 text-sm text-red-600">
                {{ errors.fullName }}
              </p>
            </div>
  
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
                  placeholder="Create a strong password"
                  @blur="validateField('password')"
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
              <!-- Password Strength Indicator -->
              <div v-if="form.password" class="mt-2">
                <div class="flex space-x-1">
                  <div
                    v-for="i in 4"
                    :key="i"
                    :class="[
                      'h-1 flex-1 rounded-full transition-colors',
                      i <= passwordStrength.score 
                        ? passwordStrength.color 
                        : 'bg-gray-200'
                    ]"
                  ></div>
                </div>
                <p :class="`text-xs mt-1 ${passwordStrength.textColor}`">
                  {{ passwordStrength.text }}
                </p>
              </div>
            </div>
  
            <!-- Confirm Password -->
            <div>
              <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i class="fas fa-lock text-gray-400"></i>
                </div>
                <input
                  id="confirmPassword"
                  v-model="form.confirmPassword"
                  :type="showConfirmPassword ? 'text' : 'password'"
                  required
                  :class="[
                    'block w-full pl-10 pr-10 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors',
                    errors.confirmPassword 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                      : 'border-gray-300 focus:border-sky-500 focus:ring-sky-200'
                  ]"
                  placeholder="Confirm your password"
                  @blur="validateField('confirmPassword')"
                />
                <button
                  type="button"
                  @click="toggleConfirmPasswordVisibility"
                  class="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <i :class="showConfirmPassword ? 'fas fa-eye-slash' : 'fas fa-eye'" class="text-gray-400 hover:text-gray-600"></i>
                </button>
              </div>
              <p v-if="errors.confirmPassword" class="mt-1 text-sm text-red-600">
                {{ errors.confirmPassword }}
              </p>
            </div>
  
            <!-- Terms and Conditions -->
            <div class="flex items-start">
              <input
                id="terms"
                v-model="form.acceptTerms"
                type="checkbox"
                required
                class="h-4 w-4 text-sky-600 focus:ring-sky-500 border-gray-300 rounded mt-0.5"
              />
              <label for="terms" class="ml-3 text-sm text-gray-600">
                I agree to the 
                <a href="#" class="text-sky-600 hover:text-sky-700 font-medium">Terms of Service</a> 
                and 
                <a href="#" class="text-sky-600 hover:text-sky-700 font-medium">Privacy Policy</a>
              </label>
            </div>
  
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
              {{ isLoading ? 'Creating Account...' : 'Create Account' }}
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
              class="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
            >
              <i class="fab fa-google text-red-500 mr-2"></i>
              Google
            </button>
            <button
              type="button"
              class="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
            >
              <i class="fab fa-github text-gray-900 mr-2"></i>
              GitHub
            </button>
          </div>
  
          <!-- Login Link -->
          <div class="mt-6 text-center">
            <p class="text-sm text-gray-600">
              Already have an account?
              <router-link to="/login" class="font-medium text-sky-600 hover:text-sky-700 transition-colors">
                Sign in here
              </router-link>
            </p>
          </div>
        </div>
  
        <!-- Success Message -->
        <transition name="fade">
          <div v-if="showSuccess" class="bg-green-50 border border-green-200 rounded-lg p-4">
            <div class="flex items-center">
              <i class="fas fa-check-circle text-green-500 mr-3"></i>
              <p class="text-green-800 font-medium">
                Account created successfully! Please check your email to verify your account.
              </p>
            </div>
          </div>
        </transition>
      </div>
    </div>
  </template>
  
  <script>
  import { ref, computed, reactive } from 'vue'
  
  export default {
    name: 'RegisterPage',
    setup() {
      const isLoading = ref(false)
      const showSuccess = ref(false)
      const showPassword = ref(false)
      const showConfirmPassword = ref(false)
  
      const form = reactive({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        acceptTerms: false
      })
  
      const errors = reactive({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: ''
      })
  
      // Password strength calculator
      const passwordStrength = computed(() => {
        const password = form.password
        if (!password) return { score: 0, text: '', color: '', textColor: '' }
  
        let score = 0
        const checks = {
          length: password.length >= 8,
          lowercase: /[a-z]/.test(password),
          uppercase: /[A-Z]/.test(password),
          numbers: /\d/.test(password),
          special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        }
  
        score = Object.values(checks).filter(Boolean).length
  
        const strengthLevels = {
          0: { text: 'Very Weak', color: 'bg-red-500', textColor: 'text-red-600' },
          1: { text: 'Weak', color: 'bg-red-400', textColor: 'text-red-600' },
          2: { text: 'Fair', color: 'bg-yellow-400', textColor: 'text-yellow-600' },
          3: { text: 'Good', color: 'bg-blue-400', textColor: 'text-blue-600' },
          4: { text: 'Strong', color: 'bg-green-400', textColor: 'text-green-600' },
          5: { text: 'Very Strong', color: 'bg-green-500', textColor: 'text-green-600' }
        }
  
        return { score, ...strengthLevels[score] }
      })
  
      // Form validation
      const isFormValid = computed(() => {
        return form.fullName.trim() !== '' &&
               form.email.trim() !== '' &&
               form.password.trim() !== '' &&
               form.confirmPassword.trim() !== '' &&
               form.acceptTerms &&
               Object.values(errors).every(error => error === '')
      })
  
      const validateField = (field) => {
        switch (field) {
          case 'fullName':
            errors.fullName = form.fullName.trim().length < 2 ? 'Full name must be at least 2 characters' : ''
            break
          case 'email':
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            errors.email = !emailRegex.test(form.email) ? 'Please enter a valid email address' : ''
            break
          case 'password':
            errors.password = form.password.length < 8 ? 'Password must be at least 8 characters' : ''
            break
          case 'confirmPassword':
            errors.confirmPassword = form.password !== form.confirmPassword ? 'Passwords do not match' : ''
            break
        }
      }
  
      const togglePasswordVisibility = () => {
        showPassword.value = !showPassword.value
      }
  
      const toggleConfirmPasswordVisibility = () => {
        showConfirmPassword.value = !showConfirmPassword.value
      }
  
      const handleRegister = async () => {
        // Validate all fields
        Object.keys(errors).forEach(field => validateField(field))
  
        if (!isFormValid.value) {
          return
        }
  
        isLoading.value = true
  
        try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 2000))
          
          // Here you would make your actual API call
          // const response = await registerUser(form)
          
          showSuccess.value = true
          
          // Reset form after successful registration
          setTimeout(() => {
            Object.keys(form).forEach(key => {
              if (key === 'acceptTerms') {
                form[key] = false
              } else {
                form[key] = ''
              }
            })
            showSuccess.value = false
          }, 3000)
  
        } catch (error) {
          console.error('Registration failed:', error)
          // Handle registration error
        } finally {
          isLoading.value = false
        }
      }
  
      return {
        form,
        errors,
        isLoading,
        showSuccess,
        showPassword,
        showConfirmPassword,
        passwordStrength,
        isFormValid,
        validateField,
        togglePasswordVisibility,
        toggleConfirmPasswordVisibility,
        handleRegister
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
  
  /* Social button hover effects */
  .hover\:bg-gray-50:hover {
    background-color: #f9fafb;
  }
  
  /* Link hover effects */
  a:hover {
    text-decoration: underline;
  }
  
  /* Password strength indicator styling */
  .h-1 {
    height: 0.25rem;
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
  
  /* Sky blue theme variables */
  :root {
    --sky-50: #f0f9ff;
    --sky-100: #e0f2fe;
    --sky-200: #bae6fd;
    --sky-500: #0ea5e9;
    --sky-600: #0284c7;
    --sky-700: #0369a1;
  }
  </style>