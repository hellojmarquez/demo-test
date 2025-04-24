import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose'; // Ensure jose is imported
import dbConnect from '@/lib/dbConnect';
import User from '@/models/UserModel';
import { comparePassword, encryptPassword } from '@/utils/auth';
export async function POST(req: NextRequest) {
	// console.log('Login sello request received');
	try {
		const { email, password } = await req.json();

		//Checking if fields are empty
		if (!email || !password) {
			return NextResponse.json(
				{ error: 'credentials are required' },
				{ status: 400 }
			);
		}
		await dbConnect();

		//Getting the user from DDBB
		const userDB = await User.findOne({ email: email });

		// 	// Verifying the password
		// 	// const isMatch = await comparePassword(password, userDB.password);

		if (password === userDB.password) {
			try {
				// fetch para obtener access token y refresh token para hacer peticiones a move music
				fetch(process.env.MOVEMUSIC_API || '', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'x-api-key': process.env.MOVEMUSIC_X_APY_KEY || '',
						Referer: process.env.MOVEMUSIC_REFERER || '',
					},
					body: JSON.stringify({
						username: process.env.MOVEMUSIC_USERNAME || '',
						password: process.env.MOVEMUSIC_PASSWORD || '',
					}),
				})
					.then(res => res.json())
					.then(r => console.log(r));

				const token = await new SignJWT({ role: 'admin' })
					.setProtectedHeader({ alg: 'HS256' })
					.setIssuedAt()
					.setExpirationTime('1h')
					.sign(new TextEncoder().encode(process.env.JWT_SECRET));
				const plainUser = userDB.toObject();
				delete plainUser.password;
				console.log(plainUser);

				// Set the JWT as a cookie
				const response = NextResponse.json({
					message: 'Login successful',
					userDB: plainUser,
				});
				response.cookies.set({
					name: 'admin-log',
					value: token,
					path: '/', // Set the cookie available for the entire site
					maxAge: 2 * 60 * 60, // 2 hours
					httpOnly: true, // Prevent client-side JavaScript from accessing the cookie
					secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
					sameSite: 'strict', // Prevent CSRF attacks
				});

				return response;
			} catch (error) {
				console.error('Error creating JWT:', error);
				return NextResponse.json(
					{ error: 'Error generating token' },
					{ status: 500 }
				);
			}
		} else {
			return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
		}
	} catch (error) {
		console.error('Error in login request:', error);
		return NextResponse.json(
			{ error: 'Internal Server Error' },
			{ status: 500 }
		);
	}
}
