import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Sello from '@/models/SelloModel';
import { Binary } from 'mongodb';

export async function PUT(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		await dbConnect();
		const { id } = params;
		const data = await request.json();

		console.log('Recibiendo datos en la API:', {
			id,
			...data,
			picture: data.picture ? 'Imagen presente' : 'No hay imagen',
		});

		// Convertir la imagen a Binary si existe
		let pictureBinary = null;
		if (data.picture) {
			try {
				// Obtener el base64 de la imagen
				let base64Data;

				// Verificar si picture es un objeto con propiedad base64 o un string
				if (typeof data.picture === 'object' && data.picture.base64) {
					base64Data = data.picture.base64;
				} else if (typeof data.picture === 'string') {
					base64Data = data.picture;
				} else {
					throw new Error('Formato de imagen no válido');
				}

				// Asegurarse de que la imagen esté en el formato correcto
				// Si la imagen ya comienza con /9j/, no añadir el prefijo
				if (!base64Data.startsWith('/9j/')) {
					// Si no comienza con /9j/, podría ser que ya tenga el prefijo data:image/jpeg;base64,
					// en ese caso, extraer solo la parte base64
					if (base64Data.includes('base64,')) {
						base64Data = base64Data.split('base64,')[1];
					}
				}

				pictureBinary = Binary.createFromBase64(base64Data);
				console.log('Imagen convertida a Binary correctamente');
			} catch (error) {
				console.error('Error al convertir la imagen a Binary:', error);
				return NextResponse.json(
					{ error: 'Error al procesar la imagen' },
					{ status: 400 }
				);
			}
		}

		const updatedSello = await Sello.findByIdAndUpdate(
			id,
			{
				$set: {
					name: data.name,
					company: data.company,
					catalog_num: data.catalog_num,
					primary_genre: data.primary_genre,
					year: data.year,
					contract_received: data.contract_received,
					information_accepted: data.information_accepted,
					label_approved: data.label_approved,
					picture: pictureBinary,
				},
			},
			{ new: true }
		);

		if (!updatedSello) {
			return NextResponse.json(
				{ error: 'Sello no encontrado' },
				{ status: 404 }
			);
		}

		console.log('Sello actualizado:', {
			...updatedSello.toObject(),
			picture: updatedSello.picture ? 'Binary data' : 'No hay imagen',
		});

		return NextResponse.json(updatedSello, { status: 200 });
	} catch (error) {
		console.error('Error updating sello:', error);
		return NextResponse.json(
			{ error: 'Error al actualizar el sello' },
			{ status: 500 }
		);
	}
}
