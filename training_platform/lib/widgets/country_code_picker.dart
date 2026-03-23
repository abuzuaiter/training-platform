import 'package:flutter/material.dart';

class Country {
  final String name;
  final String code;
  final String dialCode;

  const Country({required this.name, required this.code, required this.dialCode});
}

const List<Country> countries = [
  Country(name: 'Afghanistan', code: 'AF', dialCode: '+93'),
  Country(name: 'Albania', code: 'AL', dialCode: '+355'),
  Country(name: 'Algeria', code: 'DZ', dialCode: '+213'),
  Country(name: 'Andorra', code: 'AD', dialCode: '+376'),
  Country(name: 'Angola', code: 'AO', dialCode: '+244'),
  Country(name: 'Argentina', code: 'AR', dialCode: '+54'),
  Country(name: 'Armenia', code: 'AM', dialCode: '+374'),
  Country(name: 'Australia', code: 'AU', dialCode: '+61'),
  Country(name: 'Austria', code: 'AT', dialCode: '+43'),
  Country(name: 'Azerbaijan', code: 'AZ', dialCode: '+994'),
  Country(name: 'Bahrain', code: 'BH', dialCode: '+973'),
  Country(name: 'Bangladesh', code: 'BD', dialCode: '+880'),
  Country(name: 'Belarus', code: 'BY', dialCode: '+375'),
  Country(name: 'Belgium', code: 'BE', dialCode: '+32'),
  Country(name: 'Bolivia', code: 'BO', dialCode: '+591'),
  Country(name: 'Bosnia and Herzegovina', code: 'BA', dialCode: '+387'),
  Country(name: 'Brazil', code: 'BR', dialCode: '+55'),
  Country(name: 'Bulgaria', code: 'BG', dialCode: '+359'),
  Country(name: 'Cambodia', code: 'KH', dialCode: '+855'),
  Country(name: 'Cameroon', code: 'CM', dialCode: '+237'),
  Country(name: 'Canada', code: 'CA', dialCode: '+1'),
  Country(name: 'Chile', code: 'CL', dialCode: '+56'),
  Country(name: 'China', code: 'CN', dialCode: '+86'),
  Country(name: 'Colombia', code: 'CO', dialCode: '+57'),
  Country(name: 'Congo', code: 'CG', dialCode: '+242'),
  Country(name: 'Costa Rica', code: 'CR', dialCode: '+506'),
  Country(name: 'Croatia', code: 'HR', dialCode: '+385'),
  Country(name: 'Cuba', code: 'CU', dialCode: '+53'),
  Country(name: 'Cyprus', code: 'CY', dialCode: '+357'),
  Country(name: 'Czech Republic', code: 'CZ', dialCode: '+420'),
  Country(name: 'Denmark', code: 'DK', dialCode: '+45'),
  Country(name: 'Ecuador', code: 'EC', dialCode: '+593'),
  Country(name: 'Egypt', code: 'EG', dialCode: '+20'),
  Country(name: 'Ethiopia', code: 'ET', dialCode: '+251'),
  Country(name: 'Finland', code: 'FI', dialCode: '+358'),
  Country(name: 'France', code: 'FR', dialCode: '+33'),
  Country(name: 'Georgia', code: 'GE', dialCode: '+995'),
  Country(name: 'Germany', code: 'DE', dialCode: '+49'),
  Country(name: 'Ghana', code: 'GH', dialCode: '+233'),
  Country(name: 'Greece', code: 'GR', dialCode: '+30'),
  Country(name: 'Guatemala', code: 'GT', dialCode: '+502'),
  Country(name: 'Hungary', code: 'HU', dialCode: '+36'),
  Country(name: 'India', code: 'IN', dialCode: '+91'),
  Country(name: 'Indonesia', code: 'ID', dialCode: '+62'),
  Country(name: 'Iran', code: 'IR', dialCode: '+98'),
  Country(name: 'Iraq', code: 'IQ', dialCode: '+964'),
  Country(name: 'Ireland', code: 'IE', dialCode: '+353'),
  Country(name: 'Italy', code: 'IT', dialCode: '+39'),
  Country(name: 'Japan', code: 'JP', dialCode: '+81'),
  Country(name: 'Jordan', code: 'JO', dialCode: '+962'),
  Country(name: 'Kazakhstan', code: 'KZ', dialCode: '+7'),
  Country(name: 'Kenya', code: 'KE', dialCode: '+254'),
  Country(name: 'Kuwait', code: 'KW', dialCode: '+965'),
  Country(name: 'Kyrgyzstan', code: 'KG', dialCode: '+996'),
  Country(name: 'Laos', code: 'LA', dialCode: '+856'),
  Country(name: 'Latvia', code: 'LV', dialCode: '+371'),
  Country(name: 'Lebanon', code: 'LB', dialCode: '+961'),
  Country(name: 'Libya', code: 'LY', dialCode: '+218'),
  Country(name: 'Lithuania', code: 'LT', dialCode: '+370'),
  Country(name: 'Luxembourg', code: 'LU', dialCode: '+352'),
  Country(name: 'Malaysia', code: 'MY', dialCode: '+60'),
  Country(name: 'Maldives', code: 'MV', dialCode: '+960'),
  Country(name: 'Mali', code: 'ML', dialCode: '+223'),
  Country(name: 'Malta', code: 'MT', dialCode: '+356'),
  Country(name: 'Mauritania', code: 'MR', dialCode: '+222'),
  Country(name: 'Mexico', code: 'MX', dialCode: '+52'),
  Country(name: 'Moldova', code: 'MD', dialCode: '+373'),
  Country(name: 'Mongolia', code: 'MN', dialCode: '+976'),
  Country(name: 'Montenegro', code: 'ME', dialCode: '+382'),
  Country(name: 'Morocco', code: 'MA', dialCode: '+212'),
  Country(name: 'Mozambique', code: 'MZ', dialCode: '+258'),
  Country(name: 'Myanmar', code: 'MM', dialCode: '+95'),
  Country(name: 'Nepal', code: 'NP', dialCode: '+977'),
  Country(name: 'Netherlands', code: 'NL', dialCode: '+31'),
  Country(name: 'New Zealand', code: 'NZ', dialCode: '+64'),
  Country(name: 'Nicaragua', code: 'NI', dialCode: '+505'),
  Country(name: 'Nigeria', code: 'NG', dialCode: '+234'),
  Country(name: 'North Macedonia', code: 'MK', dialCode: '+389'),
  Country(name: 'Norway', code: 'NO', dialCode: '+47'),
  Country(name: 'Oman', code: 'OM', dialCode: '+968'),
  Country(name: 'Pakistan', code: 'PK', dialCode: '+92'),
  Country(name: 'Palestine', code: 'PS', dialCode: '+970'),
  Country(name: 'Panama', code: 'PA', dialCode: '+507'),
  Country(name: 'Paraguay', code: 'PY', dialCode: '+595'),
  Country(name: 'Peru', code: 'PE', dialCode: '+51'),
  Country(name: 'Philippines', code: 'PH', dialCode: '+63'),
  Country(name: 'Poland', code: 'PL', dialCode: '+48'),
  Country(name: 'Portugal', code: 'PT', dialCode: '+351'),
  Country(name: 'Qatar', code: 'QA', dialCode: '+974'),
  Country(name: 'Romania', code: 'RO', dialCode: '+40'),
  Country(name: 'Russia', code: 'RU', dialCode: '+7'),
  Country(name: 'Rwanda', code: 'RW', dialCode: '+250'),
  Country(name: 'Saudi Arabia', code: 'SA', dialCode: '+966'),
  Country(name: 'Senegal', code: 'SN', dialCode: '+221'),
  Country(name: 'Serbia', code: 'RS', dialCode: '+381'),
  Country(name: 'Sierra Leone', code: 'SL', dialCode: '+232'),
  Country(name: 'Singapore', code: 'SG', dialCode: '+65'),
  Country(name: 'Slovakia', code: 'SK', dialCode: '+421'),
  Country(name: 'Slovenia', code: 'SI', dialCode: '+386'),
  Country(name: 'Somalia', code: 'SO', dialCode: '+252'),
  Country(name: 'South Africa', code: 'ZA', dialCode: '+27'),
  Country(name: 'South Korea', code: 'KR', dialCode: '+82'),
  Country(name: 'Spain', code: 'ES', dialCode: '+34'),
  Country(name: 'Sri Lanka', code: 'LK', dialCode: '+94'),
  Country(name: 'Sudan', code: 'SD', dialCode: '+249'),
  Country(name: 'Sweden', code: 'SE', dialCode: '+46'),
  Country(name: 'Switzerland', code: 'CH', dialCode: '+41'),
  Country(name: 'Syria', code: 'SY', dialCode: '+963'),
  Country(name: 'Taiwan', code: 'TW', dialCode: '+886'),
  Country(name: 'Tajikistan', code: 'TJ', dialCode: '+992'),
  Country(name: 'Tanzania', code: 'TZ', dialCode: '+255'),
  Country(name: 'Thailand', code: 'TH', dialCode: '+66'),
  Country(name: 'Tunisia', code: 'TN', dialCode: '+216'),
  Country(name: 'Turkey', code: 'TR', dialCode: '+90'),
  Country(name: 'Turkmenistan', code: 'TM', dialCode: '+993'),
  Country(name: 'Uganda', code: 'UG', dialCode: '+256'),
  Country(name: 'Ukraine', code: 'UA', dialCode: '+380'),
  Country(name: 'United Arab Emirates', code: 'AE', dialCode: '+971'),
  Country(name: 'United Kingdom', code: 'GB', dialCode: '+44'),
  Country(name: 'United States', code: 'US', dialCode: '+1'),
  Country(name: 'Uruguay', code: 'UY', dialCode: '+598'),
  Country(name: 'Uzbekistan', code: 'UZ', dialCode: '+998'),
  Country(name: 'Venezuela', code: 'VE', dialCode: '+58'),
  Country(name: 'Vietnam', code: 'VN', dialCode: '+84'),
  Country(name: 'Yemen', code: 'YE', dialCode: '+967'),
  Country(name: 'Zambia', code: 'ZM', dialCode: '+260'),
  Country(name: 'Zimbabwe', code: 'ZW', dialCode: '+263'),
];

class CountryCodePicker extends StatefulWidget {
  final Country selectedCountry;
  final ValueChanged<Country> onChanged;

  const CountryCodePicker({
    super.key,
    required this.selectedCountry,
    required this.onChanged,
  });

  @override
  State<CountryCodePicker> createState() => _CountryCodePickerState();
}

class _CountryCodePickerState extends State<CountryCodePicker> {
  final _searchController = TextEditingController();
  List<Country> _filtered = countries;

  void _filter(String q) {
    setState(() {
      _filtered = countries
          .where((c) =>
              c.name.toLowerCase().contains(q.toLowerCase()) ||
              c.dialCode.contains(q))
          .toList();
    });
  }

  void _show() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (_) => StatefulBuilder(
        builder: (ctx, setModalState) => SizedBox(
          height: MediaQuery.of(context).size.height * 0.75,
          child: Column(
            children: [
              const SizedBox(height: 12),
              Container(width: 40, height: 4,
                  decoration: BoxDecoration(color: Colors.grey[300],
                      borderRadius: BorderRadius.circular(2))),
              const SizedBox(height: 16),
              const Text('Select Country',
                  style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
              const SizedBox(height: 12),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: TextField(
                  controller: _searchController,
                  onChanged: (q) {
                    setModalState(() => _filter(q));
                  },
                  decoration: InputDecoration(
                    hintText: 'Search country...',
                    prefixIcon: const Icon(Icons.search, color: Color(0xFF8E8E93)),
                    filled: true,
                    fillColor: const Color(0xFFF7F8FA),
                    border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide.none),
                  ),
                ),
              ),
              const SizedBox(height: 8),
              Expanded(
                child: ListView.builder(
                  itemCount: _filtered.length,
                  itemBuilder: (_, i) {
                    final c = _filtered[i];
                    final selected = c.code == widget.selectedCountry.code;
                    return ListTile(
                      title: Text(c.name,
                          style: TextStyle(
                              fontSize: 14,
                              fontWeight: selected ? FontWeight.w600 : FontWeight.normal,
                              color: selected ? const Color(0xFF185FA5) : const Color(0xFF1A1A1A))),
                      trailing: Text(c.dialCode,
                          style: TextStyle(
                              fontSize: 14,
                              color: selected ? const Color(0xFF185FA5) : const Color(0xFF8E8E93))),
                      onTap: () {
                        widget.onChanged(c);
                        _searchController.clear();
                        setModalState(() => _filtered = countries);
                        Navigator.pop(context);
                      },
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: _show,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
        decoration: const BoxDecoration(
          border: Border(right: BorderSide(color: Color(0xFFE5E5EA))),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(widget.selectedCountry.dialCode,
                style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500,
                    color: Color(0xFF1A1A1A))),
            const SizedBox(width: 4),
            const Icon(Icons.keyboard_arrow_down, size: 16, color: Color(0xFF8E8E93)),
          ],
        ),
      ),
    );
  }
}
