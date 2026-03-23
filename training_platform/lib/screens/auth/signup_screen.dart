import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../widgets/country_code_picker.dart';

class SignupScreen extends StatefulWidget {
  const SignupScreen({super.key});

  @override
  State<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends State<SignupScreen> {
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _isLoading = false;
  bool _useEmail = false;
  Country _selectedCountry = countries.firstWhere((c) => c.code == 'QA');

  Future<void> _signup() async {
    if (_passwordController.text != _confirmPasswordController.text) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Passwords do not match'), backgroundColor: Colors.red),
      );
      return;
    }
    setState(() => _isLoading = true);
    try {
      if (_useEmail) {
        await Supabase.instance.client.auth.signUp(
          email: _emailController.text.trim(),
          password: _passwordController.text.trim(),
          data: {'full_name': _nameController.text.trim()},
        );
      } else {
        await Supabase.instance.client.auth.signUp(
          phone: '${_selectedCountry.dialCode}${_phoneController.text.trim()}',
          password: _passwordController.text.trim(),
          data: {'full_name': _nameController.text.trim()},
        );
      }
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Account created successfully!'), backgroundColor: Colors.green),
        );
        Navigator.pop(context);
      }
    } on AuthException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.message), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFEBF3FC),
      body: Center(
        child: SingleChildScrollView(
          child: Container(
            width: 380,
            margin: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(28),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF185FA5).withValues(alpha: 0.12),
                  blurRadius: 32,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            child: Column(
              children: [
                // Header
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.fromLTRB(32, 40, 32, 32),
                  decoration: const BoxDecoration(
                    color: Color(0xFF185FA5),
                    borderRadius: BorderRadius.only(
                      topLeft: Radius.circular(28),
                      topRight: Radius.circular(28),
                    ),
                  ),
                  child: Column(
                    children: [
                      Container(
                        width: 80,
                        height: 80,
                        decoration: BoxDecoration(
                          color: const Color(0xFF0C447C),
                          borderRadius: BorderRadius.circular(40),
                        ),
                        child: const Icon(Icons.fitness_center_rounded,
                            color: Color(0xFF85B7EB), size: 40),
                      ),
                      const SizedBox(height: 16),
                      const Text('Training Platform',
                          style: TextStyle(fontSize: 22,
                              fontWeight: FontWeight.w700, color: Colors.white)),
                      const SizedBox(height: 4),
                      const Text('Manage your training journey',
                          style: TextStyle(fontSize: 13, color: Color(0xFF85B7EB))),
                    ],
                  ),
                ),

                // Form
                Padding(
                  padding: const EdgeInsets.fromLTRB(28, 28, 28, 32),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Create account',
                          style: TextStyle(fontSize: 20,
                              fontWeight: FontWeight.w700, color: Color(0xFF1A1A1A))),
                      const SizedBox(height: 4),
                      const Text('Fill in your details to get started',
                          style: TextStyle(fontSize: 13, color: Color(0xFF8E8E93))),
                      const SizedBox(height: 24),

                      // Full Name
                      const Text('FULL NAME',
                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600,
                              color: Color(0xFF444441), letterSpacing: 0.3)),
                      const SizedBox(height: 6),
                      TextField(
                        controller: _nameController,
                        decoration: InputDecoration(
                          hintText: 'Your full name',
                          hintStyle: const TextStyle(color: Color(0xFFC7C7CC)),
                          prefixIcon: const Icon(Icons.person_outline, color: Color(0xFF8E8E93)),
                          filled: true,
                          fillColor: const Color(0xFFFAFAFA),
                          border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: const BorderSide(color: Color(0xFFE5E5EA), width: 1.5)),
                          enabledBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: const BorderSide(color: Color(0xFFE5E5EA), width: 1.5)),
                          focusedBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: const BorderSide(color: Color(0xFF185FA5), width: 1.5)),
                        ),
                      ),
                      const SizedBox(height: 14),

                      // Phone or Email
                      Text(_useEmail ? 'EMAIL' : 'PHONE NUMBER',
                          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600,
                              color: Color(0xFF444441), letterSpacing: 0.3)),
                      const SizedBox(height: 6),

                      if (!_useEmail)
                        Container(
                          decoration: BoxDecoration(
                            color: const Color(0xFFFAFAFA),
                            border: Border.all(color: const Color(0xFF185FA5), width: 1.5),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Row(
                            children: [
                              CountryCodePicker(
                                selectedCountry: _selectedCountry,
                                onChanged: (c) => setState(() => _selectedCountry = c),
                              ),
                              Expanded(
                                child: TextField(
                                  controller: _phoneController,
                                  keyboardType: TextInputType.phone,
                                  decoration: const InputDecoration(
                                    hintText: 'Phone number',
                                    hintStyle: TextStyle(color: Color(0xFFC7C7CC)),
                                    border: InputBorder.none,
                                    contentPadding: EdgeInsets.symmetric(horizontal: 14),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        )
                      else
                        TextField(
                          controller: _emailController,
                          keyboardType: TextInputType.emailAddress,
                          decoration: InputDecoration(
                            hintText: 'your@email.com',
                            hintStyle: const TextStyle(color: Color(0xFFC7C7CC)),
                            prefixIcon: const Icon(Icons.email_outlined, color: Color(0xFF8E8E93)),
                            filled: true,
                            fillColor: const Color(0xFFFAFAFA),
                            border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: const BorderSide(color: Color(0xFFE5E5EA), width: 1.5)),
                            enabledBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: const BorderSide(color: Color(0xFFE5E5EA), width: 1.5)),
                            focusedBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: const BorderSide(color: Color(0xFF185FA5), width: 1.5)),
                          ),
                        ),
                      const SizedBox(height: 8),

                      Align(
                        alignment: Alignment.centerRight,
                        child: GestureDetector(
                          onTap: () => setState(() => _useEmail = !_useEmail),
                          child: Text(
                            _useEmail ? 'Use phone instead' : 'Use email instead',
                            style: const TextStyle(fontSize: 12, color: Color(0xFF185FA5),
                                fontWeight: FontWeight.w500),
                          ),
                        ),
                      ),
                      const SizedBox(height: 14),

                      // Password
                      const Text('PASSWORD',
                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600,
                              color: Color(0xFF444441), letterSpacing: 0.3)),
                      const SizedBox(height: 6),
                      TextField(
                        controller: _passwordController,
                        obscureText: true,
                        decoration: InputDecoration(
                          hintText: '••••••••',
                          hintStyle: const TextStyle(color: Color(0xFFC7C7CC)),
                          prefixIcon: const Icon(Icons.lock_outline, color: Color(0xFF8E8E93)),
                          filled: true,
                          fillColor: const Color(0xFFFAFAFA),
                          border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: const BorderSide(color: Color(0xFFE5E5EA), width: 1.5)),
                          enabledBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: const BorderSide(color: Color(0xFFE5E5EA), width: 1.5)),
                          focusedBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: const BorderSide(color: Color(0xFF185FA5), width: 1.5)),
                        ),
                      ),
                      const SizedBox(height: 14),

                      // Confirm Password
                      const Text('CONFIRM PASSWORD',
                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600,
                              color: Color(0xFF444441), letterSpacing: 0.3)),
                      const SizedBox(height: 6),
                      TextField(
                        controller: _confirmPasswordController,
                        obscureText: true,
                        decoration: InputDecoration(
                          hintText: '••••••••',
                          hintStyle: const TextStyle(color: Color(0xFFC7C7CC)),
                          prefixIcon: const Icon(Icons.lock_outline, color: Color(0xFF8E8E93)),
                          filled: true,
                          fillColor: const Color(0xFFFAFAFA),
                          border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: const BorderSide(color: Color(0xFFE5E5EA), width: 1.5)),
                          enabledBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: const BorderSide(color: Color(0xFFE5E5EA), width: 1.5)),
                          focusedBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: const BorderSide(color: Color(0xFF185FA5), width: 1.5)),
                        ),
                      ),
                      const SizedBox(height: 24),

                      // Sign up button
                      SizedBox(
                        width: double.infinity,
                        height: 50,
                        child: ElevatedButton(
                          onPressed: _isLoading ? null : _signup,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF185FA5),
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(14)),
                            elevation: 0,
                          ),
                          child: _isLoading
                              ? const CircularProgressIndicator(
                                  color: Colors.white, strokeWidth: 2)
                              : const Text('Create Account',
                                  style: TextStyle(fontSize: 15,
                                      fontWeight: FontWeight.w700)),
                        ),
                      ),
                      const SizedBox(height: 16),

                      Center(
                        child: GestureDetector(
                          onTap: () => Navigator.pop(context),
                          child: RichText(
                            text: const TextSpan(
                              text: 'Already have an account? ',
                              style: TextStyle(fontSize: 13, color: Color(0xFF8E8E93)),
                              children: [
                                TextSpan(
                                  text: 'Login',
                                  style: TextStyle(color: Color(0xFF185FA5),
                                      fontWeight: FontWeight.w600),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
