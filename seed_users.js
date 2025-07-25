// Seed users: remove all and add new with phone/accountNumber
// async function seedUsers() {
//     await User.deleteMany({});
//     const users = [
//         { fullname: 'John Doe', email: 'john@example.com', password: 'password1', phone: '09155802922' },
//         { fullname: 'Jane Smith', email: 'jane@example.com', password: 'password2', phone: '08012345678' },
//         { fullname: 'Mike Brown', email: 'mike@example.com', password: 'password3', phone: '08123456789' },
//         { fullname: 'Lisa White', email: 'lisa@example.com', password: 'password4', phone: '07098765432' },
//         { fullname: 'Sam Green', email: 'sam@example.com', password: 'password5', phone: '09087654321' },
//     ];
//     for (const user of users) {
//         const hashed = await bcrypt.hash(user.password, 10);
//         const accountNumber = user.phone.slice(-10);
//         await User.create({
//             fullname: user.fullname,
//             email: user.email,
//             password: hashed,
//             phone: user.phone,
//             accountNumber,
//             amount: 300000,
//         });
//     }
//     console.log('Seeded 5 users with phone and accountNumber');
// }
