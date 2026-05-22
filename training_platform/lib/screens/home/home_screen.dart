import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

// Web design system colors
const kPrimary    = Color(0xFF6FA3C5);
const kPrimaryDim = Color(0xFFCDE2EC);
const kBg         = Color(0xFFF4F7FA);
const kSurface    = Colors.white;
const kInk        = Color(0xFF1B2A41);
const kTextSec    = Color(0xFF4D5C72);
const kTextTer    = Color(0xFF8FA0B5);
const kBorder     = Color(0xFFDDE6EE);
const kDivider    = Color(0xFFEAF0F5);
const kGreen      = Color(0xFF22A06B);
const kGreenDim   = Color(0xFFE1F1E9);

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  List<Map<String, dynamic>> _organizations = [];
  bool _isLoading = true;
  String _fullName = 'there';

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      final userId = Supabase.instance.client.auth.currentUser!.id;

      final profile = await Supabase.instance.client
          .from('users')
          .select('full_name')
          .eq('id', userId)
          .single();

      final data = await Supabase.instance.client
          .from('organization_members')
          .select('organization_id, role, organizations(id, name, logo_url)')
          .eq('user_id', userId)
          .eq('status', 'active');

      if (mounted) {
        setState(() {
          _fullName = profile['full_name'] ?? 'there';
          _organizations = List<Map<String, dynamic>>.from(data);
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _logout() async {
    await Supabase.instance.client.auth.signOut();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kBg,
      appBar: AppBar(
        backgroundColor: kSurface,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(height: 1, color: kBorder),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Hello, ${_fullName.split(' ').first} 👋',
              style: const TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.w700,
                color: kInk,
              ),
            ),
            const Text(
              'Training Platform',
              style: TextStyle(fontSize: 12, color: kTextTer),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout_rounded, color: kTextTer, size: 20),
            onPressed: _logout,
            tooltip: 'Sign out',
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: kPrimary))
          : _organizations.isEmpty
              ? _buildEmpty()
              : _buildOrganizations(),
    );
  }

  Widget _buildEmpty() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 96,
              height: 96,
              decoration: BoxDecoration(
                color: kPrimaryDim,
                borderRadius: BorderRadius.circular(48),
              ),
              child: const Icon(Icons.calendar_today_outlined,
                  size: 48, color: kPrimary),
            ),
            const SizedBox(height: 24),
            const Text(
              "No organizations yet",
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: kInk,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'You have not been added to any organization.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 14, color: kTextTer, height: 1.6),
            ),
            const SizedBox(height: 28),
            OutlinedButton.icon(
              onPressed: _loadData,
              icon: const Icon(Icons.refresh_rounded, size: 16),
              label: const Text('Refresh'),
              style: OutlinedButton.styleFrom(
                foregroundColor: kPrimary,
                side: const BorderSide(color: kPrimary),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
                padding:
                    const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildOrganizations() {
    return RefreshIndicator(
      onRefresh: _loadData,
      color: kPrimary,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _organizations.length,
        itemBuilder: (_, i) {
          final org = _organizations[i]['organizations'];
          final role = _organizations[i]['role'] as String? ?? '';
          final initial = (org['name'] as String? ?? '?')
              .trim()
              .substring(0, 1)
              .toUpperCase();
          return Container(
            margin: const EdgeInsets.only(bottom: 10),
            decoration: BoxDecoration(
              color: kSurface,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: kBorder),
            ),
            child: ListTile(
              contentPadding:
                  const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              leading: Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: kPrimaryDim,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Center(
                  child: Text(
                    initial,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      color: kPrimary,
                    ),
                  ),
                ),
              ),
              title: Text(
                org['name'] ?? '',
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: kInk,
                ),
              ),
              subtitle: Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Container(
                  alignment: Alignment.centerLeft,
                  child: Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: kPrimaryDim,
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      role.toUpperCase(),
                      style: const TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        color: kPrimary,
                        letterSpacing: 0.4,
                      ),
                    ),
                  ),
                ),
              ),
              trailing: const Icon(Icons.arrow_forward_ios_rounded,
                  size: 14, color: kTextTer),
              onTap: () {},
            ),
          );
        },
      ),
    );
  }
}
