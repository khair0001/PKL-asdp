const { supabase } = require('../config/supabase');
const bcrypt = require('bcrypt');

class UserModel {
  // Register user baru
  static async register(username, password, nama_lengkap) {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const { data, error } = await supabase
      .from('users')
      .insert([{ username, password: hashedPassword, nama_lengkap }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Login user
  static async login(username, password) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      throw new Error('Username atau password salah');
    }

    const isValid = await bcrypt.compare(password, data.password);
    if (!isValid) {
      throw new Error('Username atau password salah');
    }

    return data;
  }

  // Get user by ID
  static async getUserById(user_id) {
    const { data, error } = await supabase
      .from('users')
      .select('user_id, username, nama_lengkap, is_active')
      .eq('user_id', user_id)
      .single();

    if (error) throw error;
    return data;
  }

  // Get all users
  static async getAllUsers() {
    const { data, error } = await supabase
      .from('users')
      .select('user_id, username, nama_lengkap, is_active, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }
}

module.exports = UserModel;
