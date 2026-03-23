-- Deactivate all placeholder/demo NFT rules — only the real contract should gate access
update nft_access_rules
set is_active = false
where contract_address in (
  '0x1234567890abcdef1234567890abcdef12345678',
  '0x2345678901bcdef12345678901bcdef123456789',
  '0x3456789012cdef123456789012cdef1234567890'
);

-- Ensure the real Cronos contract is active
update nft_access_rules
set is_active = true
where contract_address = '0xe5c2f750491fc5043d8d011c34a3adb0ef900cf3'
  and chain_id = 25;
