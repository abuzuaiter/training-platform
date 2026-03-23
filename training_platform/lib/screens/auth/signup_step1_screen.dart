import 'package:flutter/material.dart';
import '../../widgets/country_code_picker.dart';
import 'signup_step2_screen.dart';

class SignupStep1Screen extends StatefulWidget {
  const SignupStep1Screen({super.key});

  @override
  State<SignupStep1Screen> createState() => _SignupStep1ScreenState();
}

class _SignupStep1ScreenState extends State<SignupStep1Screen> {
  final _phoneController = TextEditingController();
  Country _selectedCountry = countries.firstWhere((c) => c.code == 'QA');

  void _next() {
    if (_phoneController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter your phone number'),
            backgroundColor: Colors.red),
      );
      return;
    }
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => SignupStep2Screen(
          phone: '${_selectedCountry.dialCode}${_phoneController.text.trim()}',
        ),
      ),
    );
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
                  child: const Column(
                    children: [
                      CircleAvatar(
                        radius: 40,
                        backgroundColor: Color(0xFF0C447C),
                        child: Icon(Icons.fitness_center_rounded,
                            color: Color(0xFF85B7EB), size: 40),
                      ),
                      SizedBox(height: 16),
                      Text('Training Platform',
                          style: TextStyle(fontSize: 22,
                              fontWeight: FontWeight.w700, color: Colors.white)),
                      SizedBox(height: 4),
                      Text('Manage your training journey',
                          style: TextStyle(fontSize: 13, color: Color(0xFF85B7EB))),
                    ],
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(28, 28, 28, 32),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Create account',
                          style: TextStyle(fontSize: 20,
                              fontWeight: FontWeight.w700, color: Color(0xFF1A1A1A))),
                      const SizedBox(height: 4),
                      const Text('Step 1 of 2 — Enter your phone number',
                          style: TextStyle(fontSize: 13, color: Color(0xFF8E8E93))),
                      const SizedBox(height: 8),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(4),
                        child: LinearProgressIndicator(
                          value: 0.5,
                          backgroundColor: const Color(0xFFE5E5EA),
                          color: const Color(0xFF185FA5),
                          minHeight: 4,
                        ),
                      ),
                      const SizedBox(height: 24),
                      const Text('PHONE NUMBER',
                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600,
                              color: Color(0xFF444441), letterSpacing: 0.3)),
                      const SizedBox(height: 6),
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
                      ),
                      const SizedBox(height: 24),
                      SizedBox(
                        width: double.infinity,
                        height: 50,
                        child: ElevatedButton(
                          onPressed: _next,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF185FA5),
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(14)),
                            elevation: 0,
                          ),
                          child: const Text('Continue',
                              style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
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
