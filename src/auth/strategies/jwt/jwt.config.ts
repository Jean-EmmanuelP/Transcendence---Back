export default {
	secret: process.env.JWT_SECRET,
	signOptions: { expiresIn: '60m' },
}
