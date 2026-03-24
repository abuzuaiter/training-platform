import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

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

      // Load user profile
      final profile = await Supabase.instance.client
          .from('users')
          .select('full_name')
          .eq('id', userId)
          .single();

      // Load organizations
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
      backgroundColor: const Color(0xFFF7F8FA),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Hello, ${_fullName.split(' ').first} 👋',
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700,
                    color: Color(0xFF1A1A1A))),
            const Text('Training Platform',
                style: TextStyle(fontSize: 12, color: Color(0xFF8E8E93))),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout_rounded, color: Color(0xFF8E8E93)),
            onPressed: _logout,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF185FA5)))
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
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                color: const Color(0xFFEBF3FC),
                borderRadius: BorderRadius.circular(60),
              ),
              child: const Icon(Icons.calendar_today_outlined,
                  size: 60, color: Color(0xFF185FA5)),
            ),
            const SizedBox(height: 24),
            const Text("You're all caught up!",
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700,
                    color: Color(0xFF1A1A1A))),
            const SizedBox(height: 8),
            const Text(
              'No upcoming sessions at the moment.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 14, color: Color(0xFF8E8E93), height: 1.6),
            ),
            const SizedBox(height: 32),
            OutlinedButton.icon(
              onPressed: _loadData,
              icon: const Icon(Icons.refresh_rounded, size: 18),
              label: const Text('Refresh'),
              style: OutlinedButton.styleFrom(
                foregroundColor: const Color(0xFF185FA5),
                side: const BorderSide(color: Color(0xFF185FA5)),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
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
      color: const Color(0xFF185FA5),
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _organizations.length,
        itemBuilder: (_, i) {
          final org = _organizations[i]['organizations'];
          final role = _organizations[i]['role'];
          return Container(
            margin: const EdgeInsets.only(bottom: 12),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF185FA5).withValues(alpha: 0.06),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: ListTile(
              contentPadding: const EdgeInsets.all(16),
              leading: CircleAvatar(
                radius: 28,
                backgroundColor: const Color(0xFFEBF3FC),
                child: Text(
                  org['name'].toString().substring(0, 1).toUpperCase(),
                  style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w700,
                      color: Color(0xFF185FA5)),
                ),
              ),
              title: Text(org['name'],
                  style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700,
                      color: Color(0xFF1A1A1A))),
              subtitle: Container(
                margin: const EdgeInsets.only(top: 4),
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: const Color(0xFFEBF3FC),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(role.toString().toUpperCase(),
                    style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600,
                        color: Color(0xFF185FA5))),
              ),
              trailing: const Icon(Icons.arrow_forward_ios_rounded,
                  size: 16, color: Color(0xFF8E8E93)),
              onTap: () {},
            ),
          );
        },
      ),
    );
  }
}
